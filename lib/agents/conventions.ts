const SYSTEM_PROMPT =
  "Eres un code reviewer especializado en convenciones y estilo. Analizás diffs de Pull Requests verificando: naming de variables/funciones/archivos, estructura de directorios, imports ordenados, patrones consistentes con el resto del código visible. Respondés en español con una lista concisa de desviaciones. Si todo está correcto, respondés exactamente: ✅ Convenciones respetadas.";

export async function runConventions(diff: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analizá este diff:\n\n${diff}` }],
    }),
  });

  if (!res.ok) {
    throw new Error(`conventions API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text: string | undefined = data.content?.[0]?.text;
  if (!text) throw new Error("conventions: respuesta inesperada de la API");
  return text;
}
