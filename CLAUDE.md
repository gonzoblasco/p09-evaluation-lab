@AGENTS.md

## Proyecto

Content Pipeline — pipeline multi-agente que lleva un tema desde idea → research → draft → edit → SEO check → publish, con handoffs explícitos entre agentes.

## AI Feature

- Pipeline secuencial de agentes especializados: cada etapa tiene un rol, un skill, y un contrato de handoff
- Anthropic SDK (claude-sonnet-4-6) como modelo base de cada agente
- Patrón: input estructurado → procesamiento → output estructurado → siguiente agente

## Stack nuevo (respecto al scaffold)

- Pipeline orquestado en Node.js/TypeScript puro (sin webhook trigger)
- Sin Supabase — los artefactos del pipeline se persisten en archivos locales (por ahora)
- Sin MCP GitHub — el "publish" es output a archivo markdown

## Workflow de implementación

Cada task se implementa en su propio branch, con PR a main.
El pr-review skill (GitHub) comenta cada PR antes de mergear.

## Model

Default: claude-sonnet-4-6, effort: medium
