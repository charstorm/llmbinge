export interface LLMConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  apiKey?: string;
}

export interface AppConfig {
  llm: LLMConfig;
  aspects: { fixed: string[] };
  topics: { starters: string[] };
}

export function validateConfig(raw: unknown): AppConfig {
  const obj = raw as Record<string, unknown>;
  const llm = obj["llm"] as Record<string, unknown> | undefined;
  const aspects = obj["aspects"] as Record<string, unknown> | undefined;
  const topics = obj["topics"] as Record<string, unknown> | undefined;

  if (!llm || typeof llm["endpoint"] !== "string") {
    throw new Error("Missing or invalid llm.endpoint");
  }
  if (typeof llm["model"] !== "string") {
    throw new Error("Missing or invalid llm.model");
  }

  return {
    llm: {
      endpoint: llm["endpoint"] as string,
      model: llm["model"] as string,
      temperature: (llm["temperature"] as number) ?? 0.7,
      maxTokens: (llm["max_tokens"] as number) ?? 4096,
      topP: (llm["top_p"] as number) ?? 1.0,
    },
    aspects: {
      fixed: Array.isArray(aspects?.["fixed"])
        ? (aspects["fixed"] as string[])
        : [],
    },
    topics: {
      starters: Array.isArray(topics?.["starters"])
        ? (topics["starters"] as string[])
        : [],
    },
  };
}
