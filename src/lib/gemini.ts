const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
].filter(Boolean)

let keyIndex = 0

export async function chamarGemini(prompt: string, options?: { maxTokens?: number }): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada no .env')
  }

  const key = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length]
  keyIndex++
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: options?.maxTokens || 2000,
        }
      })
    }
  )
  
  if (!response.ok) {
    // Se erro 429 (rate limit), tenta próxima chave se houver
    if (response.status === 429 && keyIndex < GEMINI_KEYS.length) {
      return chamarGemini(prompt, options)
    }
    throw new Error(`Gemini error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
