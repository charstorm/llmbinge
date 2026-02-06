import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useConfigStore } from "@/stores/configStore";
import { useUIStore } from "@/stores/uiStore";
import { ConfigField } from "./ConfigField";
import { loadDefaults } from "@/config/loadDefaults";

interface FieldErrors {
  endpoint?: string;
  model?: string;
  temperature?: string;
  maxTokens?: string;
  topP?: string;
}

export function ConfigPage() {
  const config = useConfigStore((s) => s.config);
  const loaded = useConfigStore((s) => s.loaded);
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const updateLLMConfig = useConfigStore((s) => s.updateLLMConfig);
  const updateAspects = useConfigStore((s) => s.updateAspects);
  const updateTopics = useConfigStore((s) => s.updateTopics);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("4096");
  const [topP, setTopP] = useState("1.0");
  const [apiKey, setApiKey] = useState("");
  const [aspectsText, setAspectsText] = useState("");
  const [topicsText, setTopicsText] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!loaded) loadConfig();
  }, [loaded, loadConfig]);

  useEffect(() => {
    if (loaded) {
      setEndpoint(config.llm.endpoint);
      setModel(config.llm.model);
      setTemperature(String(config.llm.temperature));
      setMaxTokens(String(config.llm.maxTokens));
      setTopP(String(config.llm.topP));
      setApiKey(config.llm.apiKey ?? "");
      setAspectsText(config.aspects.fixed.join("\n"));
      setTopicsText(config.topics.starters.join("\n"));
    }
  }, [loaded, config]);

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};

    if (!endpoint.trim()) errs.endpoint = "Endpoint is required";
    if (!model.trim()) errs.model = "Model is required";

    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      errs.temperature = "Must be between 0 and 2";
    }

    const tokens = parseInt(maxTokens, 10);
    if (isNaN(tokens) || tokens < 1) {
      errs.maxTokens = "Must be a positive integer";
    }

    const tp = parseFloat(topP);
    if (isNaN(tp) || tp < 0 || tp > 1) {
      errs.topP = "Must be between 0 and 1";
    }

    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const temp = parseFloat(temperature);
    const tokens = parseInt(maxTokens, 10);
    const tp = parseFloat(topP);

    await updateLLMConfig({
      endpoint: endpoint.trim(),
      model: model.trim(),
      temperature: temp,
      maxTokens: tokens,
      topP: tp,
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    });

    const aspects = aspectsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    await updateAspects(aspects);

    const topics = topicsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    await updateTopics(topics);

    addToast("Configuration saved", "success");
  };

  const handleReset = () => {
    const defaults = loadDefaults();
    setEndpoint(defaults.llm.endpoint);
    setModel(defaults.llm.model);
    setTemperature(String(defaults.llm.temperature));
    setMaxTokens(String(defaults.llm.maxTokens));
    setTopP(String(defaults.llm.topP));
    setApiKey("");
    setAspectsText(defaults.aspects.fixed.join("\n"));
    setTopicsText(defaults.topics.starters.join("\n"));
    setErrors({});
  };

  if (!loaded) {
    return <div className="config-page"><p>Loading...</p></div>;
  }

  return (
    <div className="config-page">
      <div className="config-page__header">
        <h1>Configuration</h1>
        <button type="button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>

      <form onSubmit={handleSave}>
        <section className="config-section">
          <h2>LLM Settings</h2>

          <ConfigField label="API Endpoint" description="OpenAI-compatible API base URL" error={errors.endpoint}>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => { setEndpoint(e.target.value); setErrors((p) => ({ ...p, endpoint: undefined })); }}
            />
          </ConfigField>

          <ConfigField label="Model" description="Model identifier (e.g. openai/gpt-4o-mini)" error={errors.model}>
            <input
              type="text"
              value={model}
              onChange={(e) => { setModel(e.target.value); setErrors((p) => ({ ...p, model: undefined })); }}
            />
          </ConfigField>

          <ConfigField label="API Key" description="Optional. Leave blank if not required.">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </ConfigField>

          <ConfigField label="Temperature" description="0 to 2. Higher = more creative." error={errors.temperature}>
            <input
              type="number"
              value={temperature}
              onChange={(e) => { setTemperature(e.target.value); setErrors((p) => ({ ...p, temperature: undefined })); }}
              step="0.1"
              min="0"
              max="2"
            />
          </ConfigField>

          <ConfigField label="Max Tokens" description="Maximum tokens per response." error={errors.maxTokens}>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => { setMaxTokens(e.target.value); setErrors((p) => ({ ...p, maxTokens: undefined })); }}
              min="1"
            />
          </ConfigField>

          <ConfigField label="Top P" description="0 to 1. Nucleus sampling." error={errors.topP}>
            <input
              type="number"
              value={topP}
              onChange={(e) => { setTopP(e.target.value); setErrors((p) => ({ ...p, topP: undefined })); }}
              step="0.05"
              min="0"
              max="1"
            />
          </ConfigField>
        </section>

        <section className="config-section">
          <h2>Aspects</h2>
          <ConfigField label="Fixed Aspects" description="One per line. Used to generate article sub-topics.">
            <textarea
              value={aspectsText}
              onChange={(e) => setAspectsText(e.target.value)}
              rows={8}
            />
          </ConfigField>
        </section>

        <section className="config-section">
          <h2>Starter Topics</h2>
          <ConfigField label="Topics" description="One per line. Shown as suggestions for new sessions.">
            <textarea
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              rows={6}
            />
          </ConfigField>
        </section>

        <div className="config-page__actions">
          <button type="submit">Save</button>
          <button type="button" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  );
}
