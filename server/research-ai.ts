import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM, listLLMModels } from "./_core/llm";

export const languageSchema = z.enum(["ar", "en"]);
export const topicInputSchema = z.object({
  language: languageSchema,
  modality: z.enum(["X-ray", "Ultrasound", "CT", "MRI", "Mammography", "Nuclear Medicine", "Interventional Radiology"]),
  bodyPart: z.enum(["Brain", "Chest", "Abdomen", "Pelvis", "Musculoskeletal", "Cardiovascular", "Head & Neck"]),
  degree: z.enum(["Master's Degree", "PhD", "Scientific Research"]),
  researchType: z.enum(["Comparative Study", "Diagnostic Accuracy", "Clinical Study", "Cross-sectional Study", "Prospective Study", "Retrospective Study", "Technical Evaluation"]),
  difficulty: z.enum(["Basic", "Intermediate", "Advanced"]),
  count: z.number().int().min(5).max(10),
});
export const ideaInputSchema = z.object({ language: languageSchema, idea: z.string().trim().min(15).max(3000) });
export const titleInputSchema = z.object({ language: languageSchema, title: z.string().trim().min(8).max(500) });

const systemPrompt = `You are a careful academic research-design assistant specializing in radiology and medical imaging. Help develop feasible research ideas, not clinical advice. Be methodologically coherent and explicit about assumptions. Never invent evidence, prevalence, diagnostic performance, study results, citations, or claims of novelty. Do not search for, retrieve, or claim to have reviewed prior studies or databases. Do not claim a topic is new; say novelty requires a separate literature review. Prefer proposals feasible for a postgraduate setting and state when access to patients, images, equipment, approvals, or a statistician must be confirmed. Expected outcomes are hypotheses or anticipated outputs, never fabricated findings. Titles must be in English, with an accurate Arabic translation. Return exactly one valid JSON object matching the requested keys, without markdown fences or prose outside JSON. Any explanations and non-title fields must be written in the user's selected language; retain standard English academic and modality terms where useful.`;

function cleanJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a JSON object.");
  return trimmed.slice(start, end + 1);
}

function checkOutput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid AI response format.");
  const result = value as Record<string, unknown>;
  if (Object.values(result).some((item) => typeof item === "string" && item.length > 12000)) throw new Error("The AI response was too long.");
  return result;
}

const unavailableTerms = ["temporarily_unavailable", "unsupported", "deprecated"];
let chosenModel: string | undefined;
// Returns a preferred available model, or undefined to let the platform use its default model.
// A failure to list models must not block generation, so catalog errors fall back to the default.
async function getModel(): Promise<string | undefined> {
  if (chosenModel) return chosenModel;
  try {
    const catalog = await listLLMModels();
    const entries = (Array.isArray(catalog.data) ? catalog.data : []) as Array<{ id: string; status?: string; description?: string }>;
    const preferred = ["gpt-6-sol", "gpt-5-mini", "gemini-3.5-flash-lite"];
    const candidate = preferred.find((id) => entries.some((entry) => entry.id === id && !unavailableTerms.some((term) => `${entry.status ?? ""} ${entry.description ?? ""}`.toLowerCase().includes(term))));
    if (candidate) chosenModel = candidate;
    return candidate;
  } catch (error) {
    console.warn("[Research AI] could not list models, using platform default:", error);
    return undefined;
  }
}

export async function generateAcademicJson<T extends Record<string, unknown>>(task: string, input: unknown): Promise<T> {
  try {
    const model = await getModel();
    const response = await invokeLLM({
      model,
      maxTokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${task}\n\nUser input (JSON): ${JSON.stringify(input)}\n\nSelected explanation language: ${(input as { language?: string }).language === "ar" ? "Arabic" : "English"}. Return concise but useful detail. Output only valid JSON.` },
      ],
    });
    const body = response as typeof response & { error?: { message?: string } };
    if (body.error) throw new Error(body.error.message || "Manus AI returned an error.");
    const content = response.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => "text" in part ? part.text : "").join("\n") : "";
    if (!text.trim()) throw new Error("Manus AI returned an empty response. Please try again.");
    let parsed: unknown;
    try { parsed = JSON.parse(cleanJson(text)); }
    catch { throw new Error("The AI response was not valid or was cut off. Please try again."); }
    return checkOutput(parsed) as T;
  } catch (error) {
    console.error("[Research AI] generation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown AI service error";
    if (message.includes("MANUS_API_KEY") || message.includes("MANUS_API_URL")) {
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The built-in Manus AI service is not configured for this environment." });
    }
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: `AI generation could not be completed: ${message}` });
  }
}

const requestWindows = new Map<string, number[]>();
export function enforceRequestLimit(key: string) {
  const now = Date.now();
  const recent = (requestWindows.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 8) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a minute before generating more content." });
  recent.push(now);
  requestWindows.set(key, recent);
  if (requestWindows.size > 1000) {
    for (const [ip, times] of requestWindows) if (!times.some((time) => now - time < 60_000)) requestWindows.delete(ip);
  }
}
