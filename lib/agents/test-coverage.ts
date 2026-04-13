const SYSTEM_PROMPT =
  "Eres un QA reviewer especializado en cobertura de tests. Analizás diffs de Pull Requests evaluando si los cambios tienen tests adecuados. Evaluás: si se agregaron tests para el código nuevo, casos edge no cubiertos, happy path vs error path. Respondés en español con una evaluación concisa. Si la cobertura es adecuada, respondés exactamente: ✅ Cobertura adecuada.";

export async function runTestCoverage(diff: string): Promise<string> {
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
    throw new Error(`test-coverage API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text: string | undefined = data.content?.[0]?.text;
  if (!text) throw new Error("test-coverage: respuesta inesperada de la API");
  return text;
}
