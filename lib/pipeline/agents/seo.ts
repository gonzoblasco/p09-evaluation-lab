import Anthropic from '@anthropic-ai/sdk';
import type { StageInput, StageOutput } from '../types';

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un especialista SEO. Analizá el artículo y retorná: 1) keyword principal sugerida, 2) score de legibilidad (1-10), 3) sugerencias de mejora SEO, 4) meta description de 160 chars. Output: análisis estructurado + artículo con mejoras aplicadas.`;

export async function run(input: StageInput): Promise<StageOutput> {
  const userMessage = input.previousOutput
    ? `Tema: ${input.topic}\n\nArtículo a analizar:\n${input.previousOutput}`
    : `Tema: ${input.topic}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4500,
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
