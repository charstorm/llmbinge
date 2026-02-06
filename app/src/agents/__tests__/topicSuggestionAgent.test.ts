import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateTopicSuggestions } from "@/agents/topicSuggestionAgent";
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

describe("generateTopicSuggestions", () => {
  it("parses numbered list from LLM response", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      "1. Topic A\n2. Topic B\n3. Topic C",
    );

    const result = await generateTopicSuggestions(
      { topic: "Photosynthesis", starterTopics: ["Science", "Biology"] },
      config,
    );
    expect(result.topics).toEqual(["Topic A", "Topic B", "Topic C"]);
  });

  it("includes topic and starters in prompt", async () => {
    let capturedMessages: llmClient.ChatMessage[] = [];
    vi.spyOn(llmClient, "completeChatCompletion").mockImplementation(
      async (_config, messages) => {
        capturedMessages = messages;
        return "1. X";
      },
    );

    await generateTopicSuggestions(
      { topic: "AI", starterTopics: ["Tech", "Science"] },
      config,
    );
    expect(capturedMessages[0]!.content).toContain("AI");
    expect(capturedMessages[0]!.content).toContain("Tech, Science");
  });

  it("handles empty response", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce("");
    const result = await generateTopicSuggestions(
      { topic: "X", starterTopics: [] },
      config,
    );
    expect(result.topics).toEqual([]);
  });
});
