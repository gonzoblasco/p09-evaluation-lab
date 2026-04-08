import { createHmac, timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  const rawBody = await request.text();

  // 1. Validar firma HMAC-SHA256
  const signature = request.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expBuffer.length ||
    !timingSafeEqual(sigBuffer, expBuffer)
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Filtrar por tipo de evento
  const event = request.headers.get("x-github-event");
  if (event !== "pull_request") {
    return Response.json({ ignored: true });
  }

  const body = JSON.parse(rawBody);
  const action: string = body.action;

  if (action !== "opened" && action !== "synchronize") {
    return Response.json({ ignored: true });
  }

  // 3. Extraer datos del PR
  const owner: string = body.repository.owner.login;
  const repo: string = body.repository.name;
  const prNumber: number = body.pull_request.number;
  const headSHA: string = body.pull_request.head.sha;

  console.log(`[webhook] PR #${prNumber} en ${owner}/${repo} — acción: ${action}`);

  // 4. Responder 200 inmediatamente; el análisis corre async
  void runAnalysis({ owner, repo, prNumber, headSHA });

  return Response.json({ received: true });
}

async function runAnalysis(_params: {
  owner: string;
  repo: string;
  prNumber: number;
  headSHA: string;
}) {
  // Implementado en T03/T04
}
