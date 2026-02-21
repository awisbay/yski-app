"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#059669", "#0d9488", "#0891b2", "#7c3aed", "#db2777", "#d97706", "#65a30d"]

interface DonutChartProps {
  data: Array<{ name: string; value: number }>
  formatter?: (value: number) => string
}

export function DonutChart({ data, formatter }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatter ? formatter(value) : value]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
