export type PipelineStage = 'idea' | 'research' | 'draft' | 'edit' | 'seo' | 'publish';

export interface StageInput {
  stage: PipelineStage;
  topic: string;
  previousOutput?: string;
}

export interface StageOutput {
  stage: PipelineStage;
  content: string;
  tokensUsed?: number;
}

export interface StageResult {
  stage: PipelineStage;
  input: StageInput;
  output?: StageOutput;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface PipelineRun {
  id: string;
  topic: string;
  stages: StageResult[];
  status: 'running' | 'completed' | 'failed';
  createdAt: Date;
}
