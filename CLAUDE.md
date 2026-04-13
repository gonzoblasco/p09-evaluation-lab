# P09 — Evaluation Lab

Effort: medium (CLAUDE_CODE_DEFAULT_EFFORT=medium)
Model: claude-sonnet-4-6

## Stack

Next.js 16, App Router, TypeScript, Tailwind v4, shadcn/ui, Supabase, Anthropic API

## Conventions

- app/ (no src/)
- Skills: @.agents/skills/<name>/SKILL.md
- Commits: commit-formatter skill
- PR review: pr-review skill antes de cerrar cada tarea
- Una feature branch por tarea → PR → merge

## Patterns clave

- Async execution: usar after() (no void, no background fetch)
- Batch parallelism: Promise.allSettled (nunca Promise.all)
- Anthropic API: @anthropic-ai/sdk directo (no Vercel AI SDK para evals)

## Skills a crear en este proyecto

- prompt-evaluator → .agents/skills/prompt-evaluator/SKILL.md
- llm-judge → .agents/skills/llm-judge/SKILL.md
- batch-orchestrator → .agents/skills/batch-orchestrator/SKILL.md

## Contexto

Ver AGENT_TASKS.md para el plan completo.
