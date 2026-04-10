import { runPipeline } from "../../../lib/pipeline/orchestrator";
import type { StageResult } from "../../../lib/pipeline/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const topic: string = body?.topic?.trim() ?? "";

  if (!topic) {
    return new Response(JSON.stringify({ error: "topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: object) => `data: ${JSON.stringify(data)}\n\n`;

      try {
        const run = await runPipeline(topic, (stageResult: StageResult) => {
          controller.enqueue(
            encode({
              type: "stage",
              stage: stageResult.stage,
              status: stageResult.status,
              content: stageResult.output?.content ?? "",
              error: stageResult.error,
            }),
          );
        });

        controller.enqueue(encode({ type: "done", runId: run.id }));
      } catch {
        controller.enqueue(
          encode({ type: "error", message: "Pipeline failed" }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
