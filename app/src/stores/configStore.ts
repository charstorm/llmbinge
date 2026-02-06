import { create } from "zustand";
import type { AppConfig, LLMConfig } from "@/config/configSchema";
import { loadDefaults } from "@/config/loadDefaults";
import { storage } from "@/storage/provider";

interface ConfigState {
  config: AppConfig;
  loaded: boolean;

  loadConfig: () => Promise<void>;
  updateLLMConfig: (updates: Partial<LLMConfig>) => Promise<void>;
  updateAspects: (aspects: string[]) => Promise<void>;
  updateTopics: (topics: string[]) => Promise<void>;
}

export const useConfigStore = create<ConfigState>()((set, get) => {
  const defaults = loadDefaults();

  return {
    config: defaults,
    loaded: false,

    loadConfig: async () => {
      const overrides = await storage.getConfigOverrides();
      if (overrides) {
        set((state) => ({
          config: {
            llm: { ...state.config.llm, ...overrides.llm },
            aspects: overrides.aspects ?? state.config.aspects,
            topics: overrides.topics ?? state.config.topics,
          },
          loaded: true,
        }));
      } else {
        set({ loaded: true });
      }
    },

    updateLLMConfig: async (updates) => {
      set((state) => ({
        config: {
          ...state.config,
          llm: { ...state.config.llm, ...updates },
        },
      }));
      const config = get().config;
      await storage.saveConfigOverrides(config);
    },

    updateAspects: async (aspects) => {
      set((state) => ({
        config: { ...state.config, aspects: { fixed: aspects } },
      }));
      const config = get().config;
      await storage.saveConfigOverrides(config);
    },

    updateTopics: async (topics) => {
      set((state) => ({
        config: { ...state.config, topics: { starters: topics } },
      }));
      const config = get().config;
      await storage.saveConfigOverrides(config);
    },
  };
});
