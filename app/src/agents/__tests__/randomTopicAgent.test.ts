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
  it("extracts a topic from CoT output", async () => {
    const cotOutput = Array.from(
      { length: 30 },
      (_, i) => `${i + 1}. Topic ${i + 1}`,
    ).join("\n");

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      cotOutput,
    );

    const result = await generateRandomTopic(config);
    expect(result.topic).toMatch(/^Topic \d+$/);
    // Should pick from the last 20
    const num = parseInt(result.topic.split(" ")[1]!);
    expect(num).toBeGreaterThanOrEqual(11);
  });

  it("uses high temperature", async () => {
    let capturedConfig: LLMConfig | null = null;
    vi.spyOn(llmClient, "completeChatCompletion").mockImplementation(
      async (cfg) => {
        capturedConfig = cfg;
        return "1. Fallback topic";
      },
    );

    await generateRandomTopic(config);
    expect(capturedConfig!.temperature).toBe(1.2);
  });

  it("falls back when no topics extracted", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      "Just some rambling text with no list",
    );

    const result = await generateRandomTopic(config);
    expect(result.topic).toBe("Quantum Entanglement");
  });
});
