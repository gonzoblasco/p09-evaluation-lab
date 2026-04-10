import fs from 'fs';
import path from 'path';
import type { PipelineRun, PipelineStage, StageInput, StageResult } from './types';
import { run as runIdea } from './agents/idea';
import { run as runResearch } from './agents/research';
import { run as runDraft } from './agents/draft';
import { run as runEdit } from './agents/edit';
import { run as runSeo } from './agents/seo';
import { run as runPublish } from './agents/publish';

const STAGES: PipelineStage[] = ['idea', 'research', 'draft', 'edit', 'seo', 'publish'];

const AGENT_MAP: Record<PipelineStage, (input: StageInput) => Promise<{ stage: PipelineStage; content: string; tokensUsed?: number }>> = {
  idea: runIdea,
  research: runResearch,
  draft: runDraft,
  edit: runEdit,
  seo: runSeo,
  publish: runPublish,
};

function persistRun(run: PipelineRun): void {
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outputDir, `${run.id}.json`),
    JSON.stringify(run, null, 2),
    'utf-8'
  );
}

export async function runPipeline(
  topic: string,
  onProgress?: (result: StageResult) => void
): Promise<PipelineRun> {
  const run: PipelineRun = {
    id: Date.now().toString(),
    topic,
    stages: [],
    status: 'running',
    createdAt: new Date(),
  };

  let previousOutput: string | undefined = undefined;

  for (const stage of STAGES) {
    const input: StageInput = { stage, topic, previousOutput };

    const stageResult: StageResult = {
      stage,
      input,
      status: 'running',
    };

    run.stages.push(stageResult);

    try {
      const output = await AGENT_MAP[stage](input);
      stageResult.output = output;
      stageResult.status = 'completed';
      previousOutput = output.content;
    } catch (err) {
      stageResult.status = 'failed';
      stageResult.error = err instanceof Error ? err.message : String(err);
      previousOutput = undefined;
    }

    onProgress?.(stageResult);
  }

  const allFailed = run.stages.every((s) => s.status === 'failed');
  run.status = allFailed ? 'failed' : 'completed';

  persistRun(run);

  return run;
}
