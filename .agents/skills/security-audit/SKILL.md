# Skill: security-audit

## Propósito
Analizar el diff de un Pull Request en busca de vulnerabilidades de seguridad.

## Cuándo usarlo
- Al hacer code review de cualquier PR
- Antes de mergear cambios que tocan auth, inputs de usuario, o dependencias

## Cómo invocarlo
```
@.agents/skills/security-audit/SKILL.md

Analizá el diff adjunto buscando vulnerabilidades de seguridad.
```

## Input esperado
- Diff completo del PR en formato git unified diff

## Output esperado
Lista de issues con severidad:
- 🔴 critical — vulnerabilidad explotable, bloquea el merge
- 🟡 warning — riesgo potencial, requiere revisión
- 🔵 info — mejora sugerida, no bloquea

Si no hay issues: `✅ Sin issues de seguridad detectados.`

## System prompt (referencia)
"Eres un security reviewer especializado en code review. Analizás diffs de Pull Requests buscando vulnerabilidades de seguridad. Buscás: secrets o API keys hardcodeadas, inputs sin sanitizar, inyecciones SQL/XSS/command, dependencias con vulnerabilidades conocidas, manejo inseguro de auth o tokens. Respondés en español con una lista concisa de issues encontrados con severidad (🔴 critical / 🟡 warning / 🔵 info). Si no encontrás issues, respondés exactamente: ✅ Sin issues de seguridad detectados."

## Implementación
`lib/agents/security-audit.ts` — función `runSecurityAudit(diff: string)`
