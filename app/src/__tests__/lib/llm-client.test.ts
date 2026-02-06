import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  streamChatCompletion,
  completeChatCompletion,
  type LLMConfig,
  type ChatMessage,
} from "@/lib/llm-client";

const config: LLMConfig = {
  endpoint: "https://api.test.com/v1",
  model: "test-model",
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
};

const messages: ChatMessage[] = [
  { role: "user", content: "Hello" },
];

function makeSSEChunk(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("streamChatCompletion", () => {
  it("streams tokens and calls onComplete", async () => {
    const tokens: string[] = [];
    const body = makeStream([
      makeSSEChunk("Hello"),
      makeSSEChunk(" World"),
      "data: [DONE]\n\n",
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onComplete = vi.fn();
    const onError = vi.fn();

    await streamChatCompletion(config, messages, {
      onToken: (t) => tokens.push(t),
      onComplete,
      onError,
    });

    expect(tokens).toEqual(["Hello", " World"]);
    expect(onComplete).toHaveBeenCalledWith("Hello World");
    expect(onError).not.toHaveBeenCalled();
  });

  it("handles multiple data lines in one chunk", async () => {
    const tokens: string[] = [];
    const body = makeStream([
      makeSSEChunk("A") + makeSSEChunk("B"),
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onComplete = vi.fn();

    await streamChatCompletion(config, messages, {
      onToken: (t) => tokens.push(t),
      onComplete,
      onError: vi.fn(),
    });

    expect(tokens).toEqual(["A", "B"]);
    expect(onComplete).toHaveBeenCalledWith("AB");
  });

  it("calls onError on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Bad Request", { status: 400 }),
    );

    const onError = vi.fn();

    await streamChatCompletion(config, messages, {
      onToken: vi.fn(),
      onComplete: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].message).toContain("400");
  });

  it("calls onError on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    const onError = vi.fn();

    await streamChatCompletion(config, messages, {
      onToken: vi.fn(),
      onComplete: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].message).toBe("Network error");
  });

  it("sends correct request body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeStream(["data: [DONE]\n\n"]), { status: 200 }),
    );

    await streamChatCompletion(config, messages, {
      onToken: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.test.com/v1/chat/completions");
    const body = JSON.parse(init!.body as string);
    expect(body.model).toBe("test-model");
    expect(body.stream).toBe(true);
    expect(body.messages).toEqual(messages);
  });

  it("sends Authorization header when apiKey is set", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeStream(["data: [DONE]\n\n"]), { status: 200 }),
    );

    await streamChatCompletion(
      { ...config, apiKey: "sk-test" },
      messages,
      { onToken: vi.fn(), onComplete: vi.fn(), onError: vi.fn() },
    );

    const headers = fetchSpy.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-test");
  });

  it("skips malformed JSON in SSE", async () => {
    const tokens: string[] = [];
    const body = makeStream([
      "data: {malformed}\n\n",
      makeSSEChunk("OK"),
      "data: [DONE]\n\n",
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    await streamChatCompletion(config, messages, {
      onToken: (t) => tokens.push(t),
      onComplete: vi.fn(),
      onError: vi.fn(),
    });

    expect(tokens).toEqual(["OK"]);
  });
});

describe("completeChatCompletion", () => {
  it("resolves with full text", async () => {
    const body = makeStream([
      makeSSEChunk("Hello"),
      makeSSEChunk(" World"),
      "data: [DONE]\n\n",
    ]);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const result = await completeChatCompletion(config, messages);
    expect(result).toBe("Hello World");
  });

  it("rejects on error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("fail"),
    );

    await expect(completeChatCompletion(config, messages)).rejects.toThrow(
      "fail",
    );
  });
});
