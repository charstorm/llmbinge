import promptTemplate from "@/prompts/mapExpansion.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import { extractTopicsFromCoT } from "@/lib/cot-parser";
import type { MapTopicsResult } from "./types";

export interface MapExpansionInput {
  topic: string;
  surroundingTopics: string[];
}

export async function generateMapExpansion(
  input: MapExpansionInput,
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<MapTopicsResult> {
  const highTempConfig: LLMConfig = { ...config, temperature: 1.2 };

  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: input.topic,
    surroundingTopics: input.surroundingTopics.join(", "),
  });

  const raw = await completeChatCompletion(
    highTempConfig,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  const topics = extractTopicsFromCoT(raw, 20);
  return { raw, topics };
}
