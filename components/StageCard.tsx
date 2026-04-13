'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from './markdown-components';

type StageStatus = 'running' | 'completed' | 'failed';

interface StageCardProps {
  stage: string;
  status: StageStatus;
  content?: string;
}

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === 'running') {
    return (
      <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
    );
  }
  if (status === 'completed') {
    return <span className="text-green-600 font-bold">✓</span>;
  }
  return <span className="text-red-600 font-bold">✗</span>;
}

const BG: Record<StageStatus, string> = {
  running: 'bg-gray-50 border-gray-200',
  completed: 'bg-green-50 border-green-200',
  failed: 'bg-red-50 border-red-200',
};

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  research: 'Research',
  draft: 'Draft',
  edit: 'Edit',
  seo: 'SEO Check',
  publish: 'Publish',
};

export function StageCard({ stage, status, content }: StageCardProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = content?.split('\n') ?? [];
  const isLong = lines.length > 3;
  const preview = lines.slice(0, 3).join('\n');

  return (
    <div className={`border rounded-lg p-4 transition-colors ${BG[status]}`}>
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon status={status} />
        <span className="font-semibold text-sm capitalize">
          {STAGE_LABELS[stage] ?? stage}
        </span>
        <span className="ml-auto text-xs text-gray-500">{status}</span>
      </div>

      {content && (
        <div className="mt-2 text-sm">
          <ReactMarkdown components={markdownComponents}>
            {expanded || !isLong ? content : preview + '\n…'}
          </ReactMarkdown>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              {expanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
