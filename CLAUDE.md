@AGENTS.md

## Proyecto

AI Code Reviewer — bot de GitHub que analiza PRs con subagents paralelos y comenta resultados automáticamente.

## AI Feature

- 3 subagents especializados en paralelo: security-audit, test-coverage, conventions
- MCP de GitHub para leer diffs y escribir comentarios en PRs
- Orquestación via Codex CLI con handoffs explícitos
- Anthropic SDK (claude-sonnet-4-6) como modelo base de cada subagent

## Stack nuevo (respecto al scaffold)

- GitHub Webhooks como trigger de PR events
- MCP GitHub para lectura de diffs y escritura de comentarios
- Codex CLI para lanzar y coordinar subagents
- Sin Supabase — no hay persistencia en este proyecto

## Model

Default: claude-sonnet-4-6, effort: medium
