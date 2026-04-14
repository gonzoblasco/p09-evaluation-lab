# 🔬 P09 — Evaluation Lab

Framework avanzado para testing y comparación de variantes de prompts orientado a **SoporteML** (Mercado Libre). Permite medir la calidad de respuestas mediante un **LLM como Juez**, comparar variantes side-by-side y analizar métricas agregadas de performance, precisión y costo.

<p align="center">
  <img src="https://img.shields.io/badge/Model-Claude%204.6%20Sonnet-orange?style=for-the-badge&logo=anthropic" alt="Claude 4.6 Sonnet">
  <img src="https://img.shields.io/badge/Stack-Next.js%2016%2FTypescript-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Database-Supabase-blue?style=for-the-badge&logo=supabase" alt="Supabase">
</p>

## 🚀 Capacidades Principales

- **Evaluación Estructurada**: Ejecuta `prompt_variants` contra `test_cases` reales, midiendo latencia, consumo de tokens y calidad de respuesta.
- **Juez Automático (LLM-as-a-Judge)**: Un segundo modelo (Claude 4.6 Sonnet) evalúa cada salida en 3 dimensiones críticas:
  - **Precisión**: Veracidad técnica y de negocio.
  - **Completitud**: Cobertura total de los puntos requeridos.
  - **Tono**: Alineación con el estilo de comunicación de SoporteML (empático, profesional).
- **Orquestación Batch**: Motor paralelo para ejecutar N variantes × M test cases simultáneamente con polling de estado en tiempo real.
- **Dashboard de Analytics**: Visualización comparativa, métricas p95 de latencia, win-rate por variante y estimación de costos operativos.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Postgres + Auth + RLS)
- **Inteligencia Artificial**: [Anthropic Claude 4.6 Sonnet](https://anthropic.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Gráficos**: [Recharts](https://recharts.org/)

## ⚙️ Configuración del Proyecto

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env.local` y completa las credenciales:

```bash
# Supabase (Público/Privado)
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# AI Engine
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Instalación y Base de Datos

```bash
# Instalar dependencias
npm install

# Inicializar Base de Datos (opcional si ya está configurado el proyecto)
supabase db push
```

*Nota: Puedes ejecutar los scripts en `supabase/migrations/` manualmente si prefieres el SQL Editor.*

### 3. Desarrollo

```bash
npm run dev
```
Accede a `http://localhost:3000` para entrar directamente al Dashboard.

## 📖 Flujo de Trabajo

### Paso 1: Configuración de Escenarios (`test-cases`)
Define interacciones de soporte reales incluyendo la pregunta del comprador, contexto del vendedor y la respuesta esperada que servirá como "Gold Standard".

### Paso 2: Diseño de Variantes (`prompt-variants`)
Itera sobre diferentes System Prompts. Puedes usar variables dinámicas como `{{buyer_question}}` y `{{seller_context}}`.

### Paso 3: Ejecución de Evaluaciones (`runs`)
Selecciona las variantes y casos que deseas comparar. El sistema procesará todo el batch en paralelo y te notificará al finalizar.

### Paso 4: Análisis de Resultados
Compara respuestas side-by-side, revisa el razonamiento del juez para cada score y analiza las métricas agregadas para tomar decisiones basadas en datos.

## 🧬 Estructura del Proyecto

- `app/api/eval/`: Endpoints optimizados para ejecución unitaria y batch.
- `app/dashboard/`: UI completa de gestión y visualización de resultados.
- `lib/eval/`: Core engine de evaluación y lógica del LLM Judge.
- `.agents/skills/`: Documentación técnica de los patrones de IA utilizados en el proyecto.

## 🧠 Skills Implementados

| Skill | Propósito |
|-------|-----------|
| **[prompt-evaluator](.agents/skills/prompt-evaluator/SKILL.md)** | Gestión de interpolación y llamadas al motor de IA. |
| **[llm-judge](.agents/skills/llm-judge/SKILL.md)** | Lógica de evaluación multivariada y normalización de scores. |
| **[batch-orchestrator](.agents/skills/batch-orchestrator/SKILL.md)** | Manejo de concurrencia y tolerancia a fallos en ejecuciones masivas. |

---
Desarrollado como parte del ecosistema de herramientas de AI para Soporte Estratégico.
