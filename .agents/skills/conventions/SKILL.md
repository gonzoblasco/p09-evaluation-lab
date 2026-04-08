# Skill: conventions

## Propósito
Verificar que los cambios de un Pull Request respetan las convenciones del proyecto.

## Cuándo usarlo
- Al hacer code review de cualquier PR
- Especialmente útil en proyectos con múltiples contribuidores

## Cómo invocarlo
```
@.agents/skills/conventions/SKILL.md

Revisá las convenciones del diff adjunto.
```

## Input esperado
- Diff completo del PR en formato git unified diff

## Output esperado
Lista de desviaciones encontradas:
- Naming de variables/funciones/archivos
- Estructura de directorios
- Imports desordenados o inconsistentes
- Patrones que rompen con el resto del código visible

Si todo está correcto: `✅ Convenciones respetadas.`

## System prompt (referencia)
"Eres un code reviewer especializado en convenciones y estilo. Analizás diffs de Pull Requests verificando: naming de variables/funciones/archivos, estructura de directorios, imports ordenados, patrones consistentes con el resto del código visible. Respondés en español con una lista concisa de desviaciones. Si todo está correcto, respondés exactamente: ✅ Convenciones respetadas."

## Implementación
`lib/agents/conventions.ts` — función `runConventions(diff: string)`
