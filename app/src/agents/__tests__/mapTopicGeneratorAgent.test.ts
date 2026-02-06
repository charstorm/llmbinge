import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMapTopics } from "@/agents/mapTopicGeneratorAgent";
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

describe("generateMapTopics", () => {
  it("extracts topics from CoT output", async () => {
    const cotOutput = Array.from(
      { length: 25 },
      (_, i) => `${i + 1}. Topic ${i + 1}`,
    ).join("\n");

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      cotOutput,
    );

    const result = await generateMapTopics({ topic: "Physics" }, config);
    expect(result.topics.length).toBe(20);
  });

  it("includes seed topic in prompt", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "completeChatCompletion").mockImplementation(
      async (_config, messages) => {
        capturedMessages = messages;
        return "1. X";
      },
    );

    await generateMapTopics({ topic: "Neuroscience" }, config);
    expect(capturedMessages[0]!.content).toContain("Neuroscience");
  });
});
