"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const LLM_PROVIDERS = [
  { value: "gemini", label: "Google Gemini", desc: "Google's Gemini models" },
  { value: "zai", label: "z.ai (Zhipu)", desc: "GLM models from z.ai" },
  { value: "xai", label: "xAI (Grok)", desc: "Grok models from xAI" },
  { value: "ollama", label: "Ollama (Local)", desc: "Self-hosted open-source models" },
];

function LlmSettings() {
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [providerModels, setProviderModels] = useState<Record<string, { id: string; label: string; note?: string }[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(false);

  useEffect(() => {
    fetch("/api/messaging/llm-settings").then(async (res) => {
      const json = await res.json();
      if (json.data) {
        setProvider(json.data.provider);
        setModel(json.data.model);
        setApiKeySet(json.data.apiKeySet);
        setApiKeyMasked(json.data.apiKeyMasked);
        if (json.data.providerModels) setProviderModels(json.data.providerModels);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/messaging/llm-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.data) {
        if (json.data.apiKeySet !== undefined) {
          setApiKeySet(json.data.apiKeySet);
          setEditingKey(false);
          setApiKey("");
          // Refetch to get masked key
          const r = await fetch("/api/messaging/llm-settings");
          const j = await r.json();
          if (j.data) setApiKeyMasked(j.data.apiKeyMasked);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const models = provider ? (providerModels[provider] || []) : [];
  const needsApiKey = provider && provider !== "ollama";

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="text-sm font-medium">AI Model</h3>
      <p className="text-xs text-muted-foreground">
        Choose the LLM that powers the agent — both the web chat and messaging bots.
        {!provider && " Using server default (env vars)."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Provider */}
        <div className="space-y-1.5">
          <Label className="text-xs">Provider</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            value={provider || ""}
            onChange={(e) => {
              const v = e.target.value || null;
              setProvider(v);
              setModel(null);
              setApiKeySet(false);
              setApiKeyMasked(null);
              setEditingKey(false);
              if (v) save({ provider: v, model: null, apiKey: null });
              else save({ provider: null, model: null, apiKey: null });
            }}
          >
            <option value="">Server default (env vars)</option>
            {LLM_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        {provider && (
          <div className="space-y-1.5">
            <Label className="text-xs">Model</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              value={model || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setModel(v);
                save({ model: v });
              }}
            >
              <option value="">Default</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}{m.note ? ` — ${m.note}` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* API Key */}
      {needsApiKey && (
        <div className="space-y-1.5">
          <Label className="text-xs">API Key</Label>
          {apiKeySet && !editingKey ? (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{apiKeyMasked}</code>
              <button
                onClick={() => setEditingKey(true)}
                className="text-xs text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={`Enter your ${LLM_PROVIDERS.find((p) => p.value === provider)?.label} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-sm font-mono"
              />
              <Button
                size="sm"
                disabled={!apiKey.trim() || saving}
                onClick={() => save({ apiKey: apiKey.trim() })}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              {editingKey && (
                <Button size="sm" variant="ghost" onClick={() => { setEditingKey(false); setApiKey(""); }}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {saving && <p className="text-xs text-muted-foreground">Saving & syncing with messaging bots...</p>}
    </div>
  );
}

export function AiModelTab() {
  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the LLM that powers the agent — both the web chat and messaging bots (Telegram, Discord).
      </p>
      <LlmSettings />
    </div>
  );
}
