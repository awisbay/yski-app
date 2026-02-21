"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { FinancialReport } from "@/types"

function useFinancialReports() {
  return useQuery({
    queryKey: ["financial-reports"],
    queryFn: () =>
      api
        .get<FinancialReport[]>("/financial/reports", { params: { skip: 0, limit: 50 } })
        .then((r) => r.data),
  })
}

interface CreateReportForm {
  title: string
  period_start: string
  period_end: string
}

export default function FinancePage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateReportForm>({
    title: "",
    period_start: "",
    period_end: "",
  })

  const { data: reports = [], isLoading } = useFinancialReports()

  const createMutation = useMutation({
    mutationFn: (data: CreateReportForm) => api.post("/financial/reports", data),
    onSuccess: () => {
      toast.success("Laporan keuangan berhasil dibuat")
      qc.invalidateQueries({ queryKey: ["financial-reports"] })
      setCreateOpen(false)
      setForm({ title: "", period_start: "", period_end: "" })
    },
    onError: () => toast.error("Gagal membuat laporan keuangan"),
  })

  const firstReport = reports[0]

  const filteredReports = reports.filter(
    (r) =>
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase())
  )

  const columns: ColumnDef<FinancialReport>[] = [
    {
      accessorKey: "title",
      header: "Judul Laporan",
      cell: ({ row }) => (
        <Link
          href={`/finance/${row.original.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "period_start",
      header: "Mulai Periode",
      cell: ({ row }) => formatDate(row.original.period_start),
    },
    {
      accessorKey: "period_end",
      header: "Akhir Periode",
      cell: ({ row }) => formatDate(row.original.period_end),
    },
    {
      accessorKey: "total_income",
      header: "Total Pemasukan",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-emerald-700">
          {formatCurrency(row.original.total_income)}
        </span>
      ),
    },
    {
      accessorKey: "total_expense",
      header: "Total Pengeluaran",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-red-600">
          {formatCurrency(row.original.total_expense)}
        </span>
      ),
    },
    {
      id: "net",
      header: "Net",
      cell: ({ row }) => {
        const net = row.original.total_income - row.original.total_expense
        return (
          <span
            className={`text-sm font-semibold ${net >= 0 ? "text-emerald-700" : "text-red-600"}`}
          >
            {net >= 0 ? "+" : ""}{formatCurrency(net)}
          </span>
        )
      },
    },
    {
      accessorKey: "is_audited",
      header: "Diaudit",
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_audited ? "approved" : "pending"} />
      ),
    },
    {
      accessorKey: "is_published",
      header: "Dipublikasikan",
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_published ? "published" : "draft"} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <Link href={`/finance/${row.original.id}`}>Lihat Detail</Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola laporan keuangan organisasi</p>
        </div>
        {can("create", "finance") && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Buat Laporan
          </Button>
        )}
      </div>

      {/* Metrics from first report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Pemasukan"
          value={isLoading ? "—" : formatCurrency(firstReport?.total_income ?? 0)}
          loading={isLoading}
          description={firstReport ? `Periode: ${formatDate(firstReport.period_start)}` : undefined}
        />
        <MetricCard
          title="Total Pengeluaran"
          value={isLoading ? "—" : formatCurrency(firstReport?.total_expense ?? 0)}
          loading={isLoading}
        />
        <MetricCard
          title="Saldo Bersih"
          value={
            isLoading
              ? "—"
              : formatCurrency((firstReport?.total_income ?? 0) - (firstReport?.total_expense ?? 0))
          }
          loading={isLoading}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
            placeholder="Cari judul laporan..."
          />
          <DataTable columns={columns} data={filteredReports} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Create report dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Laporan Keuangan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Laporan</Label>
              <Input
                id="title"
                placeholder="Contoh: Laporan Keuangan Januari 2026"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Mulai Periode</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={form.period_start}
                  onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_end">Akhir Periode</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={form.period_end}
                  onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!form.title || !form.period_start || !form.period_end || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? "Menyimpan..." : "Buat Laporan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
