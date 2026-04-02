import { supabase } from "@/integrations/supabase/client";

export type AIProvider = "groq" | "openai" | "gemini" | "anthropic" | "deepseek" | "openrouter" | "mistral" | "together" | "fireworks" | "perplexity";

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  models: { id: string; name: string }[];
  apiKeyPlaceholder: string;
  apiKeyUrl: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "groq",
    name: "Groq (ফ্রি)",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.3-70b-specdec", name: "Llama 3.3 70B SpecDec" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision" },
      { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision" },
      { id: "llama-3.2-3b-preview", name: "Llama 3.2 3B" },
      { id: "llama-3.2-1b-preview", name: "Llama 3.2 1B" },
      { id: "llama3-70b-8192", name: "Llama 3 70B" },
      { id: "llama3-8b-8192", name: "Llama 3 8B" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B" },
      { id: "qwen-qwq-32b", name: "QwQ 32B (Reasoning)" },
      { id: "allam-2-7b", name: "ALLaM 2 7B" },
      { id: "compound-beta", name: "Compound Beta" },
      { id: "compound-beta-mini", name: "Compound Beta Mini" },
    ],
    apiKeyPlaceholder: "gsk_...",
    apiKeyUrl: "https://console.groq.com/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    models: [
      { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro" },
      { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash" },
      { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
      { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
      { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
      { id: "openai/gpt-4o", name: "GPT-4o" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "openai/gpt-4.1", name: "GPT-4.1" },
      { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "openai/gpt-4.1-nano", name: "GPT-4.1 Nano" },
      { id: "openai/o3", name: "o3" },
      { id: "openai/o3-mini", name: "o3 Mini" },
      { id: "openai/o4-mini", name: "o4 Mini" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
      { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick" },
      { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout" },
      { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
      { id: "mistralai/mistral-large-latest", name: "Mistral Large" },
      { id: "mistralai/mistral-medium-latest", name: "Mistral Medium" },
      { id: "mistralai/mistral-small-latest", name: "Mistral Small" },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B" },
      { id: "qwen/qwq-32b", name: "QwQ 32B" },
      { id: "x-ai/grok-3", name: "Grok 3" },
      { id: "x-ai/grok-3-mini", name: "Grok 3 Mini" },
      { id: "cohere/command-r-plus", name: "Command R+" },
    ],
    apiKeyPlaceholder: "sk-or-...",
    apiKeyUrl: "https://openrouter.ai/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "o3", name: "o3" },
      { id: "o3-mini", name: "o3 Mini" },
      { id: "o4-mini", name: "o4 Mini" },
    ],
    apiKeyPlaceholder: "sk-...",
    apiKeyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
    apiKeyPlaceholder: "AIza...",
    apiKeyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    ],
    apiKeyPlaceholder: "sk-ant-...",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3" },
      { id: "deepseek-reasoner", name: "DeepSeek R1" },
    ],
    apiKeyPlaceholder: "sk-...",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    models: [
      { id: "mistral-large-latest", name: "Mistral Large" },
      { id: "mistral-medium-latest", name: "Mistral Medium" },
      { id: "mistral-small-latest", name: "Mistral Small" },
      { id: "open-mistral-nemo", name: "Mistral Nemo" },
      { id: "codestral-latest", name: "Codestral" },
      { id: "open-mixtral-8x22b", name: "Mixtral 8x22B" },
      { id: "open-mixtral-8x7b", name: "Mixtral 8x7B" },
    ],
    apiKeyPlaceholder: "...",
    apiKeyUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "together",
    name: "Together AI",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Turbo" },
      { id: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo", name: "Llama 3.1 405B Turbo" },
      { id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", name: "Llama 3.1 70B Turbo" },
      { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", name: "Qwen 2.5 72B" },
      { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1" },
      { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
      { id: "google/gemma-2-27b-it", name: "Gemma 2 27B" },
      { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", name: "Mixtral 8x22B" },
    ],
    apiKeyPlaceholder: "...",
    apiKeyUrl: "https://api.together.ai/settings/api-keys",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    models: [
      { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", name: "Llama 3.3 70B" },
      { id: "accounts/fireworks/models/llama-v3p1-405b-instruct", name: "Llama 3.1 405B" },
      { id: "accounts/fireworks/models/qwen2p5-72b-instruct", name: "Qwen 2.5 72B" },
      { id: "accounts/fireworks/models/deepseek-r1", name: "DeepSeek R1" },
      { id: "accounts/fireworks/models/deepseek-v3", name: "DeepSeek V3" },
    ],
    apiKeyPlaceholder: "fw_...",
    apiKeyUrl: "https://fireworks.ai/account/api-keys",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    models: [
      { id: "sonar-pro", name: "Sonar Pro" },
      { id: "sonar", name: "Sonar" },
      { id: "sonar-reasoning-pro", name: "Sonar Reasoning Pro" },
      { id: "sonar-reasoning", name: "Sonar Reasoning" },
    ],
    apiKeyPlaceholder: "pplx-...",
    apiKeyUrl: "https://www.perplexity.ai/settings/api",
  },
];

export interface AppSettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

const SETTINGS_KEY = "summarizer_settings";

const DEFAULT_SETTINGS: AppSettings = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: "",
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    
    if (!settings.apiKey) {
      const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
      settings.apiKey = savedKeys[settings.provider] || "";
    }
    
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getProviderConfig(id: AIProvider): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

// --- Supabase sync functions ---

export async function loadSettingsFromDb(): Promise<AppSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .maybeSingle();
    
    if (error || !data) return null;
    
    const apiKeys = (data.api_keys as Record<string, string>) || {};
    const provider = (data.provider as AIProvider) || "groq";
    
    return {
      provider,
      model: data.model || "llama-3.3-70b-versatile",
      apiKey: apiKeys[provider] || "",
    };
  } catch {
    return null;
  }
}

export async function saveSettingsToDb(settings: AppSettings, userId: string): Promise<void> {
  try {
    // Get existing api_keys from DB to merge
    const { data: existing } = await supabase
      .from("user_settings")
      .select("api_keys")
      .maybeSingle();
    
    const existingKeys = (existing?.api_keys as Record<string, string>) || {};
    const mergedKeys = { ...existingKeys, [settings.provider]: settings.apiKey };
    
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        provider: settings.provider,
        model: settings.model,
        api_keys: mergedKeys,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    
    if (error) console.error("DB settings save error:", error.message);
  } catch (e) {
    console.error("DB settings save failed:", e);
  }
}

export async function syncSettingsFromDb(): Promise<boolean> {
  const dbSettings = await loadSettingsFromDb();
  if (!dbSettings) return false;
  
  // Restore to localStorage
  saveSettings(dbSettings);
  
  // Also restore per-provider keys
  const { data } = await supabase
    .from("user_settings")
    .select("api_keys")
    .maybeSingle();
  
  if (data?.api_keys) {
    localStorage.setItem("provider_api_keys", JSON.stringify(data.api_keys));
  }
  
  return !!dbSettings.apiKey;
}

export function hasAnyKey(): boolean {
  const settings = getSettings();
  const savedKeys = JSON.parse(localStorage.getItem("provider_api_keys") || "{}");
  return !!(settings.apiKey?.trim() || Object.values(savedKeys).some((k: any) => k?.trim()));
}
