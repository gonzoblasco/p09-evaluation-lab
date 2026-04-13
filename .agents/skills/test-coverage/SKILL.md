# Skill: test-coverage

## Propósito
Evaluar si los cambios de un Pull Request tienen cobertura de tests adecuada.

## Cuándo usarlo
- Al hacer code review de PRs con lógica nueva o modificada
- Antes de mergear features sin tests visibles en el diff

## Cómo invocarlo
```
@.agents/skills/test-coverage/SKILL.md

Evaluá la cobertura de tests del diff adjunto.
```

## Input esperado
- Diff completo del PR en formato git unified diff

## Output esperado
Evaluación concisa que incluye:
- Si se agregaron tests para el código nuevo
- Casos edge no cubiertos identificados
- Happy path vs error path

Si la cobertura es adecuada: `✅ Cobertura adecuada.`

## System prompt (referencia)
"Eres un QA reviewer especializado en cobertura de tests. Analizás diffs de Pull Requests evaluando si los cambios tienen tests adecuados. Evaluás: si se agregaron tests para el código nuevo, casos edge no cubiertos, happy path vs error path. Respondés en español con una evaluación concisa. Si la cobertura es adecuada, respondés exactamente: ✅ Cobertura adecuada."

## Implementación
`lib/agents/test-coverage.ts` — función `runTestCoverage(diff: string)`
