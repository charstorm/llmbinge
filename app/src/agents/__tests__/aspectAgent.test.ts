import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAspects } from "@/agents/aspectAgent";
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

describe("generateAspects", () => {
  it("parses aspect list from LLM response", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      "1. Cultural significance\n2. Economic impact\n3. Scientific basis",
    );

    const result = await generateAspects(
      { topic: "Coffee", existingAspects: ["History", "Key People"] },
      config,
    );
    expect(result.aspects).toEqual([
      "Cultural significance",
      "Economic impact",
      "Scientific basis",
    ]);
  });

  it("includes existing aspects in prompt", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "completeChatCompletion").mockImplementation(
      async (_config, messages) => {
        capturedMessages = messages;
        return "1. X";
      },
    );

    await generateAspects(
      { topic: "Test", existingAspects: ["A", "B"] },
      config,
    );
    expect(capturedMessages[0]!.content).toContain("A, B");
  });
});
