import Anthropic from '@anthropic-ai/sdk';
import type { StageInput, StageOutput } from '../types';

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un estratega de contenido. Dado un tema, genera 3 ángulos distintos de enfoque y el más fuerte como propuesta final. Output: texto estructurado con los ángulos y la propuesta elegida.`;

export async function run(input: StageInput): Promise<StageOutput> {
  const userMessage = input.previousOutput
    ? `Tema: ${input.topic}\n\nContexto previo:\n${input.previousOutput}`
    : `Tema: ${input.topic}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
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
