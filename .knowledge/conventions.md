# Conventions

- Componentes en PascalCase, archivos en kebab-case
- Server Actions en /lib/actions/, prefijo con verbo (createTask, deleteTask)
- Tipos inferidos desde Supabase, no definidos a mano
- Sin console.log en producción
- output/ siempre en .gitignore — datos de ejecución no van al repo
- app/page.tsx redirige a /dashboard — nunca dejar el scaffold default de Next.js
- Módulos compartidos de UI en components/ con nombre descriptivo (ej: markdown-components.tsx)
- "type": "commonjs" nunca en package.json — rompe Next.js 16 + ESM
