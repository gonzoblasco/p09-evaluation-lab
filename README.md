# P07 — AI Code Reviewer

Bot de GitHub que analiza Pull Requests con subagents paralelos y comenta los resultados automáticamente.

## ¿Qué hace?

- Escucha eventos de PR via GitHub Webhook
- Lanza 3 subagents en paralelo, cada uno con un rol específico:
  - **security-audit** — detecta vulnerabilidades y patrones inseguros
  - **test-coverage** — evalúa cobertura y casos faltantes
  - **conventions** — verifica naming, estructura y convenciones del proyecto
- Consolida los resultados y los postea como comentario en el PR

## Stack

- Next.js 16 + TypeScript (webhook handler)
- Codex CLI (orquestación de subagents)
- MCP GitHub (leer diffs, postear comentarios)
- Anthropic claude-sonnet-4-6 (modelo de cada subagent)

## Setup

### 1. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```env
# Anthropic
ANTHROPIC_API_KEY=

# GitHub
GITHUB_TOKEN=          # Personal access token con permisos de PR read/write
GITHUB_WEBHOOK_SECRET= # Secret configurado en el webhook de GitHub
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Exponer el webhook en desarrollo

```bash
# Usar ngrok o similar para exponer localhost
ngrok http 3000
# Configurar la URL pública en GitHub → Settings → Webhooks
```

### 4. Levantar el servidor

```bash
npm run dev
```

## Arquitectura

```
GitHub PR event
  → Webhook (Next.js /api/webhook)
    → Codex CLI orchestrator
      → subagent: security-audit  (paralelo)
      → subagent: test-coverage   (paralelo)
      → subagent: conventions     (paralelo)
    → Consolidar resultados
  → MCP GitHub → comentario en PR
```

## Skills entregadas

- `security-audit` — análisis de vulnerabilidades en diffs
- `test-coverage` — evaluación de cobertura por cambio
- `conventions` — revisión de convenciones del proyecto
- `pr-review` — actualización del skill existente (ya en toolkit)

## Desarrollo

```bash
npm run dev      # Next.js en localhost:3000
npm run build    # build de producción
npm run lint     # ESLint
```

## Currículum

Proyecto 07 del Full Stack AI Developer curriculum. Primer proyecto multi-agente con subagents paralelos y orquestación via Codex CLI.
