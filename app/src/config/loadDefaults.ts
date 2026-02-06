import { parse } from "smol-toml";
import defaultsToml from "./defaults.toml?raw";
import { validateConfig, type AppConfig } from "./configSchema";

let cached: AppConfig | null = null;

export function loadDefaults(): AppConfig {
  if (cached) return cached;
  const parsed = parse(defaultsToml);
  cached = validateConfig(parsed);
  return cached;
}
