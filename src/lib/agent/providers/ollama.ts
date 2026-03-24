import { LLMProvider, AgentResponse, InputType } from "../types";

const COMPACT_SYSTEM_PROMPT = `You extract event management entities from user input. Return ONLY valid JSON.

Entity types: speaker, sponsor, venue, volunteer, media, booth, attendee, outreach, task, campaign.

Required fields per type:
- speaker: name, email, talkTitle
- sponsor: companyName, contactName, contactEmail
- venue: name, address, contactName
- volunteer: name, email
- media: companyName, contactName, type
- outreach: targetType, name
- task: title
- attendee: name, email

JSON format:
{"message":"summary","entities":[{"type":"speaker","confidence":0.9,"data":{"name":"...","email":"...","talkTitle":"..."},"warnings":[]}],"actions":[{"label":"Import 1 speaker","endpoint":"/api/speakers","method":"POST","payload":{}}],"questions":[]}`;

export class OllamaProvider implements LLMProvider {
  name = "ollama";
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = "http://localhost:11434", model = "qwen3.5:4b") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async extract(
    input: string,
    inputType: InputType,
    context?: string
  ): Promise<AgentResponse> {
    const typeHint = inputType === "csv" ? "(This is tabular/CSV data)" : "";

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: COMPACT_SYSTEM_PROMPT },
          ...(context ? [{ role: "assistant", content: `Previous context: ${context}` }] : []),
          { role: "user", content: `${typeHint}\n${input}\n\nReturn JSON only.` },
        ],
        stream: false,
        format: "json",
        options: { temperature: 0.1, num_predict: 2048 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const raw = data.message?.content || "{}";

    try {
      const parsed = JSON.parse(raw);

      // Normalize — the model might not return the exact schema
      return {
        message: parsed.message || parsed.summary || `Found ${(parsed.entities || []).length} entities`,
        entities: (parsed.entities || []).map((e: Record<string, unknown>) => ({
          type: e.type || "outreach",
          confidence: typeof e.confidence === "number" ? e.confidence : 0.8,
          data: e.data || e,
          warnings: Array.isArray(e.warnings) ? e.warnings : [],
        })),
        actions: parsed.actions || [],
        questions: parsed.questions || [],
      };
    } catch {
      // If the model returned something useful but not valid JSON, try to salvage it
      if (raw.includes("speaker") || raw.includes("sponsor") || raw.includes("name")) {
        return {
          message: `I understood your input but couldn't structure it properly. Here's what I got:\n\n${raw.slice(0, 500)}`,
          entities: [],
          actions: [],
          questions: ["Could you try pasting the data in a simpler format? For example: Name, Email, Talk Title — one per line."],
        };
      }

      return {
        message: "I couldn't parse that input. Try pasting it in a different format.",
        entities: [],
        actions: [],
        questions: ["Try: one entity per line, with name and email separated by commas."],
      };
    }
  }
}
