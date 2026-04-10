# content-pipeline

## Cuándo usar este skill
Cuando necesitás generar contenido publicable de forma automática a partir de un tema, 
pasando por etapas especializadas con handoffs explícitos entre agentes.

## Patrón: Pipeline Secuencial con Handoffs

Cada agente recibe el output del anterior como `previousOutput` en su `StageInput`.
El orquestador ejecuta los stages en secuencia y emite eventos de progreso por stage.

## Stages del pipeline
1. **idea** — expande el tema en ángulos y propuesta de enfoque
2. **research** — genera contexto, datos y puntos clave
3. **draft** — redacta el artículo completo en markdown
4. **edit** — mejora claridad, estructura y fluidez
5. **seo** — keyword principal, score de legibilidad, meta description
6. **publish** — frontmatter YAML + contenido final listo para publicar

## Contrato de handoff
```typescript
interface StageInput {
  stage: PipelineStage;
  topic: string;
  previousOutput?: string; // output del stage anterior
}

interface StageOutput {
  stage: PipelineStage;
  content: string;
  tokensUsed?: number;
}
```

## Estructura de archivos
```
lib/pipeline/
  types.ts          — tipos compartidos
  orchestrator.ts   — ejecuta stages en secuencia, emite progreso
  agents/
    idea.ts
    research.ts
    draft.ts
    edit.ts
    seo.ts
    publish.ts
```

## Streaming de progreso (SSE)
```typescript
// En la API route
const stream = new ReadableStream({
  start(controller) {
    runPipeline(topic, (stageResult) => {
      controller.enqueue(`data: ${JSON.stringify(stageResult)}\n\n`);
    }).then((run) => {
      controller.enqueue(`data: ${JSON.stringify({ type: 'done', runId: run.id })}\n\n`);
      controller.close();
    });
  }
});
```

## Cuándo aplicar este patrón
- Workflows donde cada paso depende del anterior (secuencial, no paralelo)
- Procesos con etapas especializadas y contratos de input/output claros
- Cualquier pipeline que necesite mostrar progreso en tiempo real al usuario

## Diferencia con fan-out (P07)
- **Fan-out** (P07): todos los agentes reciben el mismo input y corren en paralelo
- **Pipeline secuencial** (P08): cada agente recibe el output del anterior, corren en serie
