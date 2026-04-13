'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ScoreBarChartProps {
  data: { name: string; score: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ScoreBarChart({ data }: ScoreBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-25}
          textAnchor="end"
          interval={0}
        />
        <YAxis domain={[0, 1]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => {
            const n = typeof value === 'number' ? value : Number(value)
            return [n.toFixed(3), 'Score promedio'] as [string, string]
          }}
          labelFormatter={(label) => `Variante: ${label}`}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
