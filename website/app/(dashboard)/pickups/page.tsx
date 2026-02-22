"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import type { PickupRequest } from "@/types"

const PICKUP_TYPES = [
  "all",
  "zakat",
  "jelantah",
  "sedekah",
  "barang_bekas",
  "lain_lain",
] as const

const STATUS_OPTIONS = [
  "all",
  "pending",
  "accepted",
  "awaiting_confirmation",
  "in_progress",
  "completed",
  "cancelled",
] as const

function usePickups(status: string, pickupType: string) {
  return useQuery({
    queryKey: ["pickups", status, pickupType],
    queryFn: async () => {
      const response = await api.get<PickupRequest[]>("/pickups", {
        params: {
          skip: 0,
          limit: 100,
          status: status !== "all" ? status : undefined,
          pickup_type: pickupType !== "all" ? pickupType : undefined,
        },
      })
      return Array.isArray(response) ? response : []
    },
  })
}

export default function PickupsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all")
  const [typeFilter, setTypeFilter] = useState<(typeof PICKUP_TYPES)[number]>("all")
  const [confirmAction, setConfirmAction] = useState<{ type: "confirm_later" | "start" | "complete"; item: PickupRequest } | null>(null)

  const { data: pickups = [], isLoading, isError } = usePickups(statusFilter, typeFilter)

  const confirmLaterMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/pickups/${id}/review`, {
        action: "confirm_later",
        follow_up_message: "Penjemputan akan dikonfirmasi lagi nanti.",
      }),
    onSuccess: () => {
      toast.success("Status pickup diubah ke konfirmasi nanti.")
      qc.invalidateQueries({ queryKey: ["pickups"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal memproses pickup."),
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/pickups/${id}/start`),
    onSuccess: () => {
      toast.success("Pickup diproses.")
      qc.invalidateQueries({ queryKey: ["pickups"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal memulai pickup."),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/pickups/${id}/complete`, {}),
    onSuccess: () => {
      toast.success("Pickup selesai.")
      qc.invalidateQueries({ queryKey: ["pickups"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menyelesaikan pickup."),
  })

  const filtered = pickups.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.request_code.toLowerCase().includes(q) ||
      p.requester_name.toLowerCase().includes(q) ||
      p.requester_phone.toLowerCase().includes(q) ||
      p.pickup_address.toLowerCase().includes(q)
    )
  })

  const columns: ColumnDef<PickupRequest>[] = [
    {
      accessorKey: "request_code",
      header: "Kode",
      cell: ({ row }) => <span className="font-mono text-xs text-gray-700">{row.original.request_code}</span>,
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
      accessorKey: "pickup_type",
      header: "Jenis",
      cell: ({ row }) => <StatusBadge status={row.original.pickup_type} />,
    },
    {
      accessorKey: "pickup_address",
      header: "Lokasi",
      cell: ({ row }) => <span className="text-sm text-gray-700 line-clamp-2 max-w-[280px]">{row.original.pickup_address}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center gap-2">
            {(p.status === "pending" || p.status === "awaiting_confirmation") && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setConfirmAction({ type: "confirm_later", item: p })}
              >
                Konfirmasi Nanti
              </Button>
            )}
            {(p.status === "pending" || p.status === "accepted" || p.status === "awaiting_confirmation") && (
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setConfirmAction({ type: "start", item: p })}
              >
                Mulai
              </Button>
            )}
            {p.status === "in_progress" && (
              <Button
                size="sm"
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={() => setConfirmAction({ type: "complete", item: p })}
              >
                Selesai
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Penjemputan</h1>
        <p className="text-sm text-gray-500 mt-1">Sinkron dengan menu pickup di aplikasi mobile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Penjemputan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Gagal memuat data request penjemputan. Silakan refresh halaman.
            </div>
          )}
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
            placeholder="Cari kode, nama, telepon, atau alamat..."
            actions={
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as (typeof PICKUP_TYPES)[number])}>
                  <SelectTrigger className="h-9 w-40 text-sm">
                    <SelectValue placeholder="Jenis Pickup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="zakat">Zakat</SelectItem>
                    <SelectItem value="jelantah">Jelantah</SelectItem>
                    <SelectItem value="sedekah">Sedekah</SelectItem>
                    <SelectItem value="barang_bekas">Barang Bekas</SelectItem>
                    <SelectItem value="lain_lain">Lain-lain</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as (typeof STATUS_OPTIONS)[number])}>
                  <SelectTrigger className="h-9 w-40 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="accepted">Diterima</SelectItem>
                    <SelectItem value="awaiting_confirmation">Konfirmasi Nanti</SelectItem>
                    <SelectItem value="in_progress">Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
          <DataTable columns={columns} data={filtered} loading={isLoading} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction?.type === "confirm_later"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Konfirmasi Nanti"
        description={`Ubah request ${confirmAction?.item.request_code} menjadi konfirmasi nanti?`}
        confirmLabel="Ya, Konfirmasi Nanti"
        loading={confirmLaterMutation.isPending}
        onConfirm={() => confirmLaterMutation.mutate(confirmAction!.item.id)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "start"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Mulai Pickup"
        description={`Mulai proses request ${confirmAction?.item.request_code}?`}
        confirmLabel="Mulai"
        loading={startMutation.isPending}
        onConfirm={() => startMutation.mutate(confirmAction!.item.id)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "complete"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Selesaikan Pickup"
        description={`Tandai request ${confirmAction?.item.request_code} sebagai selesai?`}
        confirmLabel="Selesaikan"
        loading={completeMutation.isPending}
        onConfirm={() => completeMutation.mutate(confirmAction!.item.id)}
      />
    </div>
  )
}
