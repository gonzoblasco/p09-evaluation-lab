'use client';

import { useState } from 'react';
import { StageCard } from '@/components/StageCard';

type StageStatus = 'running' | 'completed' | 'failed';

interface StageEvent {
  stage: string;
  status: StageStatus;
  content: string;
  error?: string;
}

export default function DashboardPage() {
  const [topic, setTopic] = useState('');
  const [stages, setStages] = useState<StageEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!topic.trim() || running) return;

    setStages([]);
    setRunId(null);
    setError(null);
    setRunning(true);

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok || !response.body) {
        setError('Error al iniciar el pipeline.');
        setRunning(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;

          try {
            const event = JSON.parse(line);

            if (event.type === 'stage') {
              setStages((prev) => {
                const idx = prev.findIndex((s) => s.stage === event.stage);
                const updated: StageEvent = {
                  stage: event.stage,
                  status: event.status,
                  content: event.content ?? '',
                  error: event.error,
                };
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = updated;
                  return next;
                }
                return [...prev, updated];
              });
            } else if (event.type === 'done') {
              setRunId(event.runId);
            } else if (event.type === 'error') {
              setError(event.message ?? 'Pipeline error');
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Content Pipeline</h1>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ingresá un tema..."
          disabled={running}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />
        <button
          onClick={handleRun}
          disabled={running || !topic.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Ejecutando…' : 'Run Pipeline'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {stages.length > 0 && (
        <div className="flex flex-col gap-3">
          {stages.map((s) => (
            <StageCard
              key={s.stage}
              stage={s.stage}
              status={s.status}
              content={s.content || s.error}
            />
          ))}
        </div>
      )}

      {runId && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          Pipeline completado. Run ID: <span className="font-mono">{runId}</span>
        </div>
      )}
    </main>
  );
}
