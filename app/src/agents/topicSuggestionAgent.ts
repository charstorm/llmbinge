import promptTemplate from "@/prompts/topicSuggestion.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import type { TopicSuggestionResult } from "./types";

export interface TopicSuggestionInput {
  topic: string;
  starterTopics: string[];
}

function parseTopicList(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => {
      const match = /^\s*\d+[\.\)]\s*(.+)$/.exec(line);
      return match?.[1]?.trim() ?? "";
    })
    .filter((t) => t.length > 0);
}

export async function generateTopicSuggestions(
  input: TopicSuggestionInput,
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<TopicSuggestionResult> {
  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: input.topic,
    starterTopics: input.starterTopics.join(", "),
  });

  const raw = await completeChatCompletion(
    config,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  return { raw, topics: parseTopicList(raw) };
}
