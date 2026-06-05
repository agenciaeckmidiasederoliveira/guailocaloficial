// Shared AI helper — Fase 3
// PRIMÁRIO: Lovable AI Gateway com google/gemini-2.5-flash (sem chave do usuário).
// FALLBACK 1: OpenAI direto com gpt-4o-mini (se OPENAI_API_KEY existir).
// FALLBACK 2: Gemini direto (se GEMINI_API_KEY existir).

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const LOVABLE_MODEL = "google/gemini-2.5-flash";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: any;
}

export interface AIResult {
  text?: string;
  toolArgs?: any;
  provider: "lovable-gemini" | "openai" | "gemini";
}

// ---------- Lovable AI Gateway (Gemini 2.5 Flash) ----------
async function callLovableGateway(
  messages: ChatMessage[],
  tool?: ToolSchema,
): Promise<AIResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY ausente");

  const body: any = {
    model: LOVABLE_MODEL,
    messages,
  };
  if (tool) {
    body.tools = [{ type: "function", function: tool }];
    body.tool_choice = { type: "function", function: { name: tool.name } };
  }

  const res = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) {
      throw new Error("Rate limit excedido no Lovable AI. Tente novamente em instantes.");
    }
    if (res.status === 402) {
      throw new Error(
        "Créditos do Lovable AI esgotados. Adicione créditos em Settings > Workspace > Usage.",
      );
    }
    throw new Error(`Lovable AI ${res.status}: ${t}`);
  }

  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  const tc = msg?.tool_calls?.[0]?.function?.arguments;
  if (tc) {
    try {
      return { toolArgs: JSON.parse(tc), provider: "lovable-gemini" };
    } catch {
      return { text: tc, provider: "lovable-gemini" };
    }
  }
  return { text: (msg?.content || "").trim(), provider: "lovable-gemini" };
}

// ---------- OpenAI direto (fallback) ----------
async function callOpenAI(
  messages: ChatMessage[],
  tool?: ToolSchema,
): Promise<AIResult> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY ausente");

  const body: any = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
  };
  if (tool) {
    body.tools = [{ type: "function", function: tool }];
    body.tool_choice = { type: "function", function: { name: tool.name } };
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  const tc = msg?.tool_calls?.[0]?.function?.arguments;
  if (tc) {
    try {
      return { toolArgs: JSON.parse(tc), provider: "openai" };
    } catch {
      return { text: tc, provider: "openai" };
    }
  }
  return { text: (msg?.content || "").trim(), provider: "openai" };
}

// ---------- Gemini direto (último fallback) ----------
async function callGeminiDirect(
  messages: ChatMessage[],
  tool?: ToolSchema,
): Promise<AIResult> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY ausente");

  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: any = { contents };
  if (sys) body.systemInstruction = { parts: [{ text: sys }] };
  if (tool) {
    body.tools = [{
      functionDeclarations: [{
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      }],
    }];
    body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [tool.name] } };
  }

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const fc = parts.find((p: any) => p.functionCall)?.functionCall;
  if (fc) return { toolArgs: fc.args, provider: "gemini" };
  const text = parts.map((p: any) => p.text || "").join("").trim();
  return { text, provider: "gemini" };
}

// ---------- Public API ----------
export async function generateAI(
  messages: ChatMessage[],
  tool?: ToolSchema,
): Promise<AIResult> {
  const hasLovable = !!Deno.env.get("LOVABLE_API_KEY");
  const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
  const hasGemini = !!Deno.env.get("GEMINI_API_KEY");

  // PRIMÁRIO: Lovable AI Gateway (Gemini 2.5 Flash)
  if (hasLovable) {
    try {
      return await callLovableGateway(messages, tool);
    } catch (e) {
      console.warn("[AI] Lovable Gateway falhou:", (e as Error).message);
      if (hasOpenAI) {
        try {
          return await callOpenAI(messages, tool);
        } catch (e2) {
          console.warn("[AI] OpenAI fallback falhou:", (e2 as Error).message);
          if (hasGemini) return await callGeminiDirect(messages, tool);
          throw e2;
        }
      }
      if (hasGemini) return await callGeminiDirect(messages, tool);
      throw e;
    }
  }

  // Sem Lovable AI: tenta OpenAI direto, depois Gemini
  if (hasOpenAI) {
    try {
      return await callOpenAI(messages, tool);
    } catch (e) {
      console.warn("[AI] OpenAI falhou, tentando Gemini:", (e as Error).message);
      if (hasGemini) return await callGeminiDirect(messages, tool);
      throw e;
    }
  }
  return await callGeminiDirect(messages, tool);
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const r = await generateAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  return r.text || "";
}
