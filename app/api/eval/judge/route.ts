import { NextRequest, NextResponse } from 'next/server'
import { runJudge } from '@/lib/eval/llm-judge'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { eval_result_id, expected_response, actual_response, buyer_question } =
    body as Record<string, unknown>

  if (!eval_result_id || typeof eval_result_id !== 'string' || !UUID_RE.test(eval_result_id)) {
    return NextResponse.json({ error: 'eval_result_id must be a valid UUID.' }, { status: 400 })
  }
  if (!expected_response || typeof expected_response !== 'string') {
    return NextResponse.json({ error: 'expected_response is required.' }, { status: 400 })
  }
  if (!actual_response || typeof actual_response !== 'string') {
    return NextResponse.json({ error: 'actual_response is required.' }, { status: 400 })
  }
  if (!buyer_question || typeof buyer_question !== 'string') {
    return NextResponse.json({ error: 'buyer_question is required.' }, { status: 400 })
  }

  try {
    const result = await runJudge({ eval_result_id, expected_response, actual_response, buyer_question })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.'
    if (msg.startsWith('NOT_FOUND:')) {
      return NextResponse.json({ error: 'eval_result_id not found.' }, { status: 400 })
    }
    if (msg.startsWith('PARSE_ERROR:')) {
      const [, ...rest] = msg.split('\n')
      return NextResponse.json(
        { error: msg.split(':')[1], raw_response: rest.join('\n') },
        { status: 502 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
