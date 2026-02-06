import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRandomTopic } from "@/agents/randomTopicAgent";
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

describe("generateRandomTopic", () => {
  it("extracts a topic from a 10-item list", async () => {
    const output = Array.from({ length: 10 }, (_, i) => `${i + 1}. Topic ${i + 1}`).join("\n");

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(output);

    const result = await generateRandomTopic(config);
    // should pick from the last 3 (Topic 8, 9, or 10)
    expect(result.topic).toMatch(/^Topic (8|9|10)$/);
    expect(result.raw).toBe(output);
  });

  it("sends a single broad topic in the prompt", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "completeChatCompletion").mockImplementation(
      async (_cfg, msgs) => {
        capturedMessages = msgs;
        return "1. Some topic";
      },
    );

    await generateRandomTopic(config);
    const prompt = capturedMessages[0]!.content;
    expect(prompt).toContain("The broad area is:");
    expect(prompt).toContain("diverse from the previous");
  });

  it("falls back when no topics extracted", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      "Just some rambling text with no list",
    );

    const result = await generateRandomTopic(config);
    expect(result.topic).toBe("Quantum Entanglement");
  });
});
