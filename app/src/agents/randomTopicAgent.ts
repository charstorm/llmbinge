import promptTemplate from "@/prompts/randomTopic.prompt.md?raw";
import { interpolateTemplate } from "@/lib/template";
import { completeChatCompletion, type LLMConfig } from "@/lib/llm-client";
import { extractTopicsFromCoT } from "@/lib/cot-parser";
import type { RandomTopicResult } from "./types";

const TOPICS = [
  "physics",
  "chemistry",
  "biology",
  "astronomy",
  "geology",
  "mathematics",
  "computer science",
  "medicine",
  "engineering",
  "economics",
  "philosophy",
  "psychology",
  "linguistics",
  "archaeology",
  "anthropology",
  "music",
  "literature",
  "cinema",
  "architecture",
  "painting",
  "mythology",
  "religion",
  "warfare",
  "espionage",
  "exploration",
  "agriculture",
  "cooking",
  "fashion",
  "sports",
  "transportation",
  "communication",
  "law",
  "politics",
  "ecology",
  "oceanography",
  "photography",
  "inventions",
  "cryptography",
  "epidemiology",
  "geography",
];

export async function generateRandomTopic(
  config: LLMConfig,
  signal?: AbortSignal,
): Promise<RandomTopicResult> {
  const seed = TOPICS[Math.floor(Math.random() * TOPICS.length)]!;
  const systemPrompt = interpolateTemplate(promptTemplate, {
    topic: seed,
  });

  console.log(systemPrompt);

  const raw = await completeChatCompletion(
    config,
    [{ role: "system", content: systemPrompt }],
    signal,
  );

  const topics = extractTopicsFromCoT(raw, 10);

  // pick 1 randomly from the last 3
  const tail = topics.slice(-3);
  const topic =
    tail.length > 0
      ? tail[Math.floor(Math.random() * tail.length)]!
      : "Quantum Entanglement";

  return { raw, topic };
}
