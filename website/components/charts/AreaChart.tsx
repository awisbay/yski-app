"use client"

import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AreaChartProps {
  data: Array<Record<string, unknown>>
  xKey: string
  yKey: string
  label?: string
  color?: string
  formatter?: (value: number) => string
}

export function AreaChart({
  data,
  xKey,
  yKey,
  label,
  color = "#059669",
  formatter,
}: AreaChartProps) {
  const valueFormatter = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0)
    return formatter ? formatter(numericValue) : numericValue
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${yKey})`}
        />
      </ReAreaChart>
    </ResponsiveContainer>
  )
}
