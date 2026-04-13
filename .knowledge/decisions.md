# Decisiones arquitectónicas

## P06 — n8n Ops Center

### MCP server como intermediario entre Next.js y n8n

**Decisión:** El dashboard Next.js no llama directamente a la API de n8n. En su lugar, pasa por un MCP server Express en `mcp-server/` que expone tools (`list_workflows`, `get_executions`, etc.).

**Por qué:** Permite que el mismo MCP server sea consumido por otros clientes (Claude Desktop, agentes AI) además del dashboard. Centraliza la autenticación con n8n en un solo lugar.

---

### McpServer instancia por request (no global)

**Decisión:** `createMcpServer()` se llama dentro de cada route handler, creando una instancia nueva por request.

**Por qué:** `McpServer` es stateful — mantiene referencia al transport conectado. Compartir una instancia global causa "Already connected to a transport" en la segunda llamada.

---

### Server Components llaman al MCP directo, no via API route interna

**Decisión:** Los Server Components llaman a `MCP_SERVER_URL/mcp` directamente.

**Por qué:** Los fetch internos en Server Components no llevan cookies de sesión. El auth check de Supabase en la API route devuelve 401.

---

### Sin endpoint REST para ejecutar workflows

**Decisión:** El botón "Ejecutar" fue reemplazado por un link directo al editor de n8n.

**Por qué:** La n8n REST API no expone un endpoint funcional para disparar workflows con Manual Trigger.

---

### Formato de fechas manual en lugar de toLocaleString

**Decisión:** Las fechas se formatean con template literal manual (`YYYY-MM-DD HH:mm`).

**Por qué:** `toLocaleString()` produce resultados distintos en Node.js (SSR) y browser (CSR), causando hydration mismatch.

---

### Auth check en API routes, no en middleware

**Decisión:** Cada API route llama a `createClient().auth.getUser()` al inicio del handler.

**Por qué:** El middleware en Next.js 16 se llama `proxy.ts`. Para evitar confusión, el auth check es explícito en cada route.

---

## P08 — Content Pipeline

### Pipeline secuencial vs fan-out

**Decisión:** Los 6 agentes corren en secuencia estricta, no en paralelo.

**Por qué:** Cada agente depende semánticamente del output del anterior. El draft necesita el research; el edit necesita el draft. Paralelizar no tiene sentido cuando hay dependencia de datos entre stages.

---

### SSE via ReadableStream nativo (sin Vercel AI SDK)

**Decisión:** La API route usa `new ReadableStream()` directamente con `controller.enqueue()`.

**Por qué:** El pipeline no es un stream de tokens LLM — es un stream de eventos de progreso por stage. El Vercel AI SDK está optimizado para streaming de texto token a token; aquí el evento es "stage completado", no tokens individuales.

---

### Errores por stage no abortan el pipeline

**Decisión:** Si un agente falla, el orquestador marca ese stage como 'failed' y continúa con `previousOutput = undefined`.

**Por qué:** Un artículo parcialmente generado tiene más valor que ninguno. El usuario puede ver hasta qué stage llegó y reintentar.

---

### publishContent capturado en evento de stage, no en evento done

**Decisión:** `setPublishContent` se llama cuando llega el evento SSE del stage 'publish' con status 'completed', no cuando llega el evento 'done'.

**Por qué:** El evento 'done' llega después de que el stream se cierra. En ese momento el estado de React con los stages puede no estar actualizado todavía (closure stale). Capturar en el evento del stage garantiza que el contenido está disponible.

---

### Workflow: branch por task + PR + pr-review como gate continuo

**Decisión:** Cada task del AGENT_TASKS.md se implementa en su propio branch, con PR a main y pr-review antes de mergear.

**Por qué:** Convierte el pr-review de revisión final a gate de calidad continuo. En P08 detectó restos de P07 que rompían el build — algo que una revisión al final hubiera encontrado demasiado tarde.
