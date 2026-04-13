const SYSTEM_PROMPT =
  "Eres un security reviewer especializado en code review. Analizás diffs de Pull Requests buscando vulnerabilidades de seguridad. Buscás: secrets o API keys hardcodeadas, inputs sin sanitizar, inyecciones SQL/XSS/command, dependencias con vulnerabilidades conocidas, manejo inseguro de auth o tokens. Respondés en español con una lista concisa de issues encontrados con severidad (🔴 critical / 🟡 warning / 🔵 info). Si no encontrás issues, respondés exactamente: ✅ Sin issues de seguridad detectados.";

export async function runSecurityAudit(diff: string): Promise<string> {
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
    throw new Error(`security-audit API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text: string | undefined = data.content?.[0]?.text;
  if (!text) throw new Error("security-audit: respuesta inesperada de la API");
  return text;
}
