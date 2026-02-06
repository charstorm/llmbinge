import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMapLayout } from "@/agents/mapLayoutAgent";
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

describe("generateMapLayout", () => {
  it("parses JSON layout from LLM response", async () => {
    const jsonResponse = JSON.stringify({
      groups: [
        {
          name: "Science",
          topics: [
            { name: "Physics", x: 0.2, y: 0.3 },
            { name: "Chemistry", x: 0.3, y: 0.3 },
          ],
        },
      ],
    });

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      jsonResponse,
    );

    const result = await generateMapLayout(
      { topics: ["Physics", "Chemistry"] },
      config,
    );
    expect(result.layout.groups.length).toBe(1);
    expect(result.layout.groups[0]!.topics.length).toBe(2);
  });

  it("parses JSON wrapped in code block", async () => {
    const response = `\`\`\`json\n${JSON.stringify({
      groups: [
        {
          name: "G1",
          topics: [{ name: "T1", x: 0.5, y: 0.5 }],
        },
      ],
    })}\n\`\`\``;

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      response,
    );

    const result = await generateMapLayout({ topics: ["T1"] }, config);
    expect(result.layout.groups[0]!.topics[0]!.name).toBe("T1");
  });

  it("clamps coordinates to 0-1 range", async () => {
    const jsonResponse = JSON.stringify({
      groups: [
        {
          name: "G1",
          topics: [{ name: "T1", x: -0.5, y: 1.5 }],
        },
      ],
    });

    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      jsonResponse,
    );

    const result = await generateMapLayout({ topics: ["T1"] }, config);
    expect(result.layout.groups[0]!.topics[0]!.x).toBe(0);
    expect(result.layout.groups[0]!.topics[0]!.y).toBe(1);
  });

  it("throws on invalid JSON", async () => {
    vi.spyOn(llmClient, "completeChatCompletion").mockResolvedValueOnce(
      "not json at all",
    );

    await expect(
      generateMapLayout({ topics: ["T1"] }, config),
    ).rejects.toThrow();
  });
});
