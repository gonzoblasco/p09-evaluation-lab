import Anthropic from '@anthropic-ai/sdk';
import type { StageInput, StageOutput } from '../types';

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un editor. Recibís un artículo en markdown. Mejorá la claridad, estructura, y fluidez. Eliminá redundancias. No cambies el contenido factual. Output: artículo editado en markdown.`;

export async function run(input: StageInput): Promise<StageOutput> {
  const userMessage = input.previousOutput
    ? `Tema: ${input.topic}\n\nArtículo a editar:\n${input.previousOutput}`
    : `Tema: ${input.topic}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    stage: input.stage,
    content,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
