'use client';

import ReactMarkdown from 'react-markdown';
import { markdownComponents } from './markdown-components';

interface OutputViewerProps {
  content: string;
  filename: string;
}

export function OutputViewer({ content, filename }: OutputViewerProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Output final</span>
        <button
          onClick={handleDownload}
          className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Descargar .md
        </button>
      </div>
      <div className="p-4">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
