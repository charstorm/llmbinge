import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateArticle } from "@/agents/articleAgent";
import type { LLMConfig } from "@/lib/llm-client";
import * as llmClient from "@/lib/llm-client";

const config: LLMConfig = {
  endpoint: "https://api.test.com/v1",
  model: "test",
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("generateArticle", () => {
  it("returns content from streaming LLM", async () => {
    vi.spyOn(llmClient, "streamChatCompletion").mockImplementation(
      (_config, _messages, callbacks) => {
        callbacks.onToken("Hello ");
        callbacks.onToken("world");
        callbacks.onComplete("Hello world");
        return Promise.resolve();
      },
    );

    const result = await generateArticle({ topic: "Photosynthesis" }, config);
    expect(result.content).toBe("Hello world");
    expect(result.raw).toBe("Hello world");
  });

  it("passes topic in the system prompt", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "streamChatCompletion").mockImplementation(
      (_config, messages, callbacks) => {
        capturedMessages = messages;
        callbacks.onComplete("done");
        return Promise.resolve();
      },
    );

    await generateArticle({ topic: "Quantum Computing" }, config);
    expect(capturedMessages[0]!.content).toContain("Quantum Computing");
  });

  it("includes aspect instruction when provided", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "streamChatCompletion").mockImplementation(
      (_config, messages, callbacks) => {
        capturedMessages = messages;
        callbacks.onComplete("done");
        return Promise.resolve();
      },
    );

    await generateArticle(
      { topic: "Vitamin C", aspect: "History" },
      config,
    );
    expect(capturedMessages[0]!.content).toContain("History");
  });

  it("forwards streaming callbacks", async () => {
    vi.spyOn(llmClient, "streamChatCompletion").mockImplementation(
      (_config, _messages, callbacks) => {
        callbacks.onToken("chunk");
        callbacks.onComplete("chunk");
        return Promise.resolve();
      },
    );

    const tokens: string[] = [];
    await generateArticle({ topic: "Test" }, config, {
      onToken: (t) => tokens.push(t),
      onComplete: vi.fn(),
      onError: vi.fn(),
    });
    expect(tokens).toEqual(["chunk"]);
  });

  it("rejects on LLM error", async () => {
    vi.spyOn(llmClient, "streamChatCompletion").mockImplementation(
      (_config, _messages, callbacks) => {
        callbacks.onError(new Error("LLM failed"));
        return Promise.resolve();
      },
    );

    await expect(
      generateArticle({ topic: "Test" }, config),
    ).rejects.toThrow("LLM failed");
  });
});
