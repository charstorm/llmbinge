import promptTemplate from "@/prompts/mapLayout.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import type { MapLayoutResult, MapLayoutGroup } from "./types";

export interface MapLayoutInput {
  topics: string[];
}

function parseLayoutJSON(raw: string): { groups: MapLayoutGroup[] } {
  // Extract JSON from the response (may be wrapped in markdown code blocks)
  let jsonStr = raw;
  const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  if (codeBlockMatch?.[1]) {
    jsonStr = codeBlockMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim()) as { groups: MapLayoutGroup[] };

  if (!Array.isArray(parsed.groups)) {
    throw new Error("Invalid layout: missing groups array");
  }

  // Validate and clamp coordinates
  for (const group of parsed.groups) {
    for (const topic of group.topics) {
      topic.x = Math.max(0, Math.min(1, topic.x));
      topic.y = Math.max(0, Math.min(1, topic.y));
    }
  }

  return parsed;
}

export async function generateMapLayout(
  input: MapLayoutInput,
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<MapLayoutResult> {
  const topicList = input.topics
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");

  const systemPrompt = interpolateTemplate(promptTemplate, {
    topics: topicList,
  });

  const raw = await completeChatCompletion(
    config,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  const layout = parseLayoutJSON(raw);
  return { raw, layout };
}
