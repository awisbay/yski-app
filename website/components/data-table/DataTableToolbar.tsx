"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DataTableToolbarProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  placeholder?: string
  actions?: React.ReactNode
}

export function DataTableToolbar({
  globalFilter,
  onGlobalFilterChange,
  placeholder = "Cari...",
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-9 text-sm"
        />
        {globalFilter && (
          <button
            onClick={() => onGlobalFilterChange("")}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
