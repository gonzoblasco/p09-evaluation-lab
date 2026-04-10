# seo-agent

## Cuándo usar este skill
Cuando necesitás analizar y optimizar contenido en markdown para búsqueda orgánica,
generando keyword principal, score de legibilidad, sugerencias de mejora y meta description.

## System prompt
```
Eres un especialista SEO. Analizá el artículo y retorná:
1) keyword principal sugerida
2) score de legibilidad (1-10)
3) sugerencias de mejora SEO
4) meta description de 160 chars
Output: análisis estructurado + artículo con mejoras aplicadas.
```

## Input esperado
- Artículo completo en markdown (output del stage edit)
- Topic original (para validar relevancia de la keyword)

## Output esperado
```
## Análisis SEO: "[título del artículo]"

**Keyword principal:** [keyword]
**Score de legibilidad:** [N]/10
**Meta description:** [160 chars máx]

### Sugerencias de mejora
- [sugerencia 1]
- [sugerencia 2]

---
[artículo con mejoras SEO aplicadas]
```

## Integración en pipeline
Este agente corre como stage 5 (seo) en el content-pipeline.
Recibe el output del stage edit como previousOutput.
Su output alimenta al stage publish.

## Uso standalone
Útil para auditar artículos existentes fuera del pipeline:
```typescript
import { run } from '@/lib/pipeline/agents/seo';
const result = await run({ stage: 'seo', topic, previousOutput: articleMarkdown });
```
