import { LLMError, StreamError } from "./errors";

export interface LLMConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  apiKey?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamChatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const tag = `[llm] ${config.model}`;
  const systemSnippet = messages.find((m) => m.role === "system")?.content.slice(0, 120) ?? "";
  console.log(`${tag} ← request (${messages.length} msgs) ${systemSnippet}…`);
  const startTime = performance.now();

  const url = `${config.endpoint}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        stream: true,
      }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      console.log(`${tag} ✕ aborted before response`);
      return;
    }
    console.error(`${tag} ✕ network error:`, err);
    callbacks.onError(
      err instanceof Error ? err : new LLMError("Network request failed"),
    );
    return;
  }

  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      // ignore
    }
    console.error(`${tag} ✕ HTTP ${response.status}: ${body.slice(0, 200)}`);
    callbacks.onError(
      new LLMError(
        `LLM API error ${response.status}: ${body}`,
        response.status,
      ),
    );
    return;
  }

  if (!response.body) {
    callbacks.onError(new StreamError("Response body is null"));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        const json = trimmed.slice(6);
        try {
          const parsed = JSON.parse(json) as {
            choices?: { delta?: { content?: string } }[];
          };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            callbacks.onToken(content);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim() && buffer.trim() !== "data: [DONE]") {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6)) as {
            choices?: { delta?: { content?: string } }[];
          };
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            callbacks.onToken(content);
          }
        } catch {
          // ignore
        }
      }
    }

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`${tag} → complete (${accumulated.length} chars, ${elapsed}s)`);
    callbacks.onComplete(accumulated);
  } catch (err) {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    if (signal?.aborted) {
      console.log(`${tag} ✕ aborted (${elapsed}s, ${accumulated.length} chars partial)`);
      return;
    } else {
      console.error(`${tag} ✕ error (${elapsed}s):`, err);
      callbacks.onError(
        err instanceof Error
          ? new StreamError(err.message, accumulated)
          : new StreamError("Stream read failed", accumulated),
      );
    }
  }
}

export async function completeChatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    streamChatCompletion(
      config,
      messages,
      {
        onToken: () => {},
        onComplete: resolve,
        onError: reject,
      },
      signal,
    );
  });
}
