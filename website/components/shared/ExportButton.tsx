"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export"

interface ExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  label?: string
  disabled?: boolean
}

export function ExportButton({ data, filename, label = "Export Excel", disabled }: ExportButtonProps) {
  function handleExport() {
    exportToExcel(data, { filename })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}
