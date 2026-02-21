"use client"

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface BarChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  label?: string
  color?: string
  formatter?: (value: number) => string
}

export function BarChart({ data, xKey, yKey, label, color = "#059669", formatter }: BarChartProps) {
  const valueFormatter = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0)
    return formatter ? formatter(numericValue) : numericValue
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatter}
        />
        <Tooltip
          formatter={(value) => [valueFormatter(value), label ?? yKey]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          cursor={{ fill: "#f0fdf4" }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
