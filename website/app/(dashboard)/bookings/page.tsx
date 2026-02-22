"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { BarChart } from "@/components/charts/BarChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ExportButton } from "@/components/shared/ExportButton"
import api from "@/lib/api"
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { MovingBooking, BookingMetrics } from "@/types"

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "in_progress", label: "Dalam Proses" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
]

function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get<MovingBooking[]>("/bookings", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response) ? response : []
    },
  })
}

function useBookingMetrics() {
  return useQuery({
    queryKey: ["dashboard", "bookings", "metrics"],
    queryFn: () =>
      api.get<BookingMetrics>("/dashboard/bookings/metrics"),
  })
}

export default function BookingsPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [confirmAction, setConfirmAction] = useState<{ type: string; booking: MovingBooking } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const { data: bookings = [], isLoading, isError } = useBookings()
  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useBookingMetrics()

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bookings/${id}/approve`),
    onSuccess: () => {
      toast.success("Pemesanan disetujui")
      qc.invalidateQueries({ queryKey: ["bookings"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menyetujui pemesanan"),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Pemesanan ditolak")
      qc.invalidateQueries({ queryKey: ["bookings"] })
      setConfirmAction(null)
      setRejectReason("")
    },
    onError: () => toast.error("Gagal menolak pemesanan"),
  })

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter
    const matchesSearch =
      !search ||
      b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      b.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.purpose ?? "").toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const byStatus = (status: string) =>
    metrics?.by_status?.find((s) => s.status === status)?.count ?? 0

  const columns: ColumnDef<MovingBooking>[] = [
    {
      accessorKey: "booking_code",
      header: "Kode",
      cell: ({ row }) => (
        <Link
          href={`/bookings/${row.original.id}`}
          className="font-mono text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {row.original.booking_code}
        </Link>
      ),
    },
    {
      accessorKey: "booking_date",
      header: "Tanggal",
      cell: ({ row }) => formatDate(row.original.booking_date),
    },
    {
      accessorKey: "time_slot",
      header: "Slot Waktu",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.time_slot}</span>
      ),
    },
    {
      accessorKey: "requester_name",
      header: "Pemohon",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.original.requester_name}</p>
          <p className="text-xs text-gray-500">{row.original.requester_phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "purpose",
      header: "Keperluan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 line-clamp-1 max-w-[200px]">{row.original.purpose}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "assigned_to_name",
      header: "Ditugaskan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.assigned_to_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const b = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/bookings/${b.id}`}>Lihat Detail</Link>
              </DropdownMenuItem>
              {b.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-emerald-600"
                    onClick={() => setConfirmAction({ type: "approve", booking: b })}
                  >
                    Setujui
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setConfirmAction({ type: "reject", booking: b })}
                  >
                    Tolak
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const exportData = filteredBookings.map((b) => ({
    "Kode": b.booking_code,
    "Tanggal": formatDate(b.booking_date),
    "Slot Waktu": b.time_slot,
    "Pemohon": b.requester_name,
    "Telepon": b.requester_phone,
    "Keperluan": b.purpose,
    "Status": b.status,
    "Ditugaskan": b.assigned_to_name ?? "",
    "Dibuat": format(new Date(b.created_at), "dd/MM/yyyy HH:mm"),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pemesanan Angkut</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua pemesanan layanan angkut jenazah</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => qc.invalidateQueries({ queryKey: ["bookings"] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Menunggu"
          value={metricsLoading ? "—" : formatNumber(byStatus("pending"))}
          loading={metricsLoading}
        />
        <MetricCard
          title="Disetujui"
          value={metricsLoading ? "—" : formatNumber(byStatus("approved"))}
          loading={metricsLoading}
        />
        <MetricCard
          title="Selesai"
          value={metricsLoading ? "—" : formatNumber(byStatus("completed"))}
          loading={metricsLoading}
        />
        <MetricCard
          title="Ditolak"
          value={metricsLoading ? "—" : formatNumber(byStatus("rejected"))}
          loading={metricsLoading}
        />
      </div>

      {/* Weekly trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Pemesanan Mingguan</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <BarChart
              data={metrics?.weekly_trend ?? []}
              xKey="label"
              yKey="count"
              label="Pemesanan"
            />
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Gagal memuat data booking pickup. Silakan refresh halaman.
            </div>
          )}
          {metricsError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Ringkasan metrik booking belum berhasil dimuat, namun data tabel tetap ditampilkan.
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <DataTableToolbar
                globalFilter={search}
                onGlobalFilterChange={setSearch}
                placeholder="Cari kode, pemohon, atau keperluan..."
                actions={
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-44 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ExportButton
                      data={exportData}
                      filename={`pemesanan-${format(new Date(), "yyyyMMdd")}`}
                    />
                  </div>
                }
              />
            </div>
          </div>
          <DataTable columns={columns} data={filteredBookings} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Approve confirm */}
      <ConfirmDialog
        open={confirmAction?.type === "approve"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Setujui Pemesanan"
        description={`Setujui pemesanan ${confirmAction?.booking.booking_code} dari ${confirmAction?.booking.requester_name}?`}
        confirmLabel="Setujui"
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate(confirmAction!.booking.id)}
      />

      {/* Reject dialog */}
      <ConfirmDialog
        open={confirmAction?.type === "reject"}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmAction(null)
            setRejectReason("")
          }
        }}
        title="Tolak Pemesanan"
        description={`Tolak pemesanan ${confirmAction?.booking.booking_code}? Berikan alasan penolakan.`}
        confirmLabel="Tolak"
        variant="destructive"
        loading={rejectMutation.isPending}
        onConfirm={() =>
          rejectMutation.mutate({ id: confirmAction!.booking.id, reason: rejectReason })
        }
      />
    </div>
  )
}
