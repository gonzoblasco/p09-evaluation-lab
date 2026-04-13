import Anthropic from '@anthropic-ai/sdk';
import type { StageInput, StageOutput } from '../types';

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un investigador. Dado un tema y un ángulo de enfoque, genera contexto relevante, estadísticas clave, y 3-5 puntos de datos concretos. No inventes datos específicos, usa placeholders como [STAT: buscar X]. Output: texto estructurado listo para usar en un draft.`;

export async function run(input: StageInput): Promise<StageOutput> {
  const userMessage = input.previousOutput
    ? `Tema: ${input.topic}\n\nÁngulo de enfoque:\n${input.previousOutput}`
    : `Tema: ${input.topic}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
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
