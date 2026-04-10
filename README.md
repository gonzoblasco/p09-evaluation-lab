# P08 — Content Pipeline

Pipeline multi-agente que transforma un tema en contenido publicable, pasando por etapas especializadas con handoffs explícitos.

## ¿Qué hace?

Dado un tema de entrada, el pipeline ejecuta en secuencia:

1. **Idea** — expande el tema en ángulos y enfoque
2. **Research** — genera contexto, datos relevantes y fuentes sugeridas
3. **Draft** — redacta el contenido completo
4. **Edit** — mejora claridad, estructura y tono
5. **SEO Check** — evalúa y optimiza para búsqueda
6. **Publish** — genera el artefacto final en markdown listo para publicar

## Stack

- Next.js 16 + TypeScript (UI de control del pipeline)
- Anthropic claude-sonnet-4-6 (modelo de cada agente)
- Artefactos persistidos en archivos markdown locales

## Setup

### 1. Variables de entorno

```env
ANTHROPIC_API_KEY=
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Levantar

```bash
npm run dev
```

## Arquitectura

```
Input: tema
  → Agente: idea
  → Agente: research
  → Agente: draft
  → Agente: edit
  → Agente: seo-check
  → Agente: publish
Output: archivo markdown
```

## Skills entregadas

- `content-pipeline` — patrón de pipeline secuencial con handoffs
- `seo-agent` — análisis y optimización SEO de contenido

## Currículum

Proyecto 08 del Full Stack AI Developer curriculum. Primer pipeline secuencial completo con handoffs explícitos entre agentes especializados.
