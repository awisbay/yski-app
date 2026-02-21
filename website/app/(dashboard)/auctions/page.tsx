"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Trash2, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { BarChart } from "@/components/charts/BarChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils"
import type { AuctionItem, AuctionMetrics } from "@/types"

const AUCTION_STATUSES = ["all", "ready", "bidding", "payment_pending", "sold", "cancelled"] as const
type AuctionStatusFilter = (typeof AUCTION_STATUSES)[number]

function useAuctions(status: AuctionStatusFilter) {
  return useQuery({
    queryKey: ["auctions", status],
    queryFn: () =>
      api
        .get<AuctionItem[]>("/auctions", {
          params: {
            skip: 0,
            limit: 100,
            status: status !== "all" ? status : undefined,
          },
        })
        .then((r) => r.data),
  })
}

function useAuctionMetrics() {
  return useQuery({
    queryKey: ["dashboard", "auctions", "metrics"],
    queryFn: () => api.get<AuctionMetrics>("/dashboard/auctions/metrics").then((r) => r.data),
  })
}

export default function AuctionsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AuctionStatusFilter>("all")
  const [deleteTarget, setDeleteTarget] = useState<AuctionItem | null>(null)

  const { data: auctions = [], isLoading } = useAuctions(statusFilter)
  const { data: metrics, isLoading: metricsLoading } = useAuctionMetrics()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auctions/${id}`),
    onSuccess: () => {
      toast.success("Lelang berhasil dihapus")
      qc.invalidateQueries({ queryKey: ["auctions"] })
      qc.invalidateQueries({ queryKey: ["dashboard", "auctions", "metrics"] })
      setDeleteTarget(null)
    },
    onError: () => toast.error("Gagal menghapus lelang"),
  })

  const filteredAuctions = search
    ? auctions.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
    : auctions

  const columns: ColumnDef<AuctionItem>[] = [
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => (
        <Link
          href={`/auctions/${row.original.id}`}
          className="font-medium text-gray-900 hover:text-emerald-600 line-clamp-1"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "starting_price",
      header: "Harga Awal",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{formatCurrency(row.original.starting_price)}</span>
      ),
    },
    {
      accessorKey: "current_price",
      header: "Harga Saat Ini",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-emerald-700">
          {formatCurrency(row.original.current_price)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status Lelang",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "payment_status",
      header: "Status Bayar",
      cell: ({ row }) => {
        const ps = row.original.payment_status
        return ps ? <StatusBadge status={ps} /> : <span className="text-gray-400 text-sm">—</span>
      },
    },
    {
      accessorKey: "winner_id",
      header: "Pemenang",
      cell: ({ row }) => {
        const w = row.original.winner_id
        return (
          <span className="text-sm text-gray-600">{w ? w.slice(0, 8) + "..." : "—"}</span>
        )
      },
    },
    {
      accessorKey: "start_time",
      header: "Mulai",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDateTime(row.original.start_time)}</span>
      ),
    },
    {
      accessorKey: "end_time",
      header: "Selesai",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDateTime(row.original.end_time)}</span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const a = row.original
        const canEdit = a.status === "ready"
        const canDelete = a.status === "ready" || a.status === "cancelled"
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/auctions/${a.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/auctions/${a.id}?edit=true`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteTarget(a)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const activeAuctions =
    metrics?.by_status?.find((s) => s.status === "bidding")?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Lelang</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua item lelang dan penawaran</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" asChild>
          <Link href="/auctions/new">
            <PlusCircle className="h-4 w-4" />
            Buat Lelang
          </Link>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Lelang Aktif"
          value={metricsLoading ? "—" : formatNumber(activeAuctions)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Nilai Terjual"
          value={metricsLoading ? "—" : formatCurrency(metrics?.total_sold_value ?? 0)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Menunggu Pembayaran"
          value={metricsLoading ? "—" : formatNumber(metrics?.pending_payments ?? 0)}
          loading={metricsLoading}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lelang Berdasarkan Status</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <BarChart
              data={metrics?.by_status ?? []}
              xKey="status"
              yKey="count"
              label="Jumlah"
            />
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
            placeholder="Cari judul lelang..."
            actions={
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as AuctionStatusFilter)}
              >
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="ready">Siap</SelectItem>
                  <SelectItem value="bidding">Sedang Berlangsung</SelectItem>
                  <SelectItem value="payment_pending">Menunggu Bayar</SelectItem>
                  <SelectItem value="sold">Terjual</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <DataTable columns={columns} data={filteredAuctions} loading={isLoading} />
          <p className="text-xs text-gray-400 text-right">
            Menampilkan {formatNumber(filteredAuctions.length)} lelang
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Lelang"
        description={`Hapus lelang "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id)}
      />
    </div>
  )
}
