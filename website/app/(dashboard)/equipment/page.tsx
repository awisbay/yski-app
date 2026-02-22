"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { DonutChart } from "@/components/charts/DonutChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatDate, formatNumber, getMediaUrl } from "@/lib/utils"
import type { MedicalEquipment, EquipmentLoan, EquipmentMetrics } from "@/types"

function useEquipment() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const response = await api.get<MedicalEquipment[]>("/equipment", { params: { skip: 0, limit: 100, is_active: true } })
      return Array.isArray(response.data) ? response.data : []
    },
  })
}

function useEquipmentLoans() {
  return useQuery({
    queryKey: ["equipment-loans"],
    queryFn: async () => {
      const response = await api.get<EquipmentLoan[]>("/equipment/loans/all", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response.data) ? response.data : []
    },
  })
}

function useEquipmentMetrics() {
  return useQuery({
    queryKey: ["dashboard", "equipment", "metrics"],
    queryFn: () =>
      api.get<EquipmentMetrics>("/dashboard/equipment/metrics").then((r) => r.data),
  })
}

export default function EquipmentPage() {
  const qc = useQueryClient()
  const [searchEquipment, setSearchEquipment] = useState("")
  const [searchLoans, setSearchLoans] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name?: string } | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")

  const { data: equipment = [], isLoading: equipLoading, isError: equipError } = useEquipment()
  const { data: loans = [], isLoading: loansLoading, isError: loansError } = useEquipmentLoans()
  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useEquipmentMetrics()

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/equipment/${id}/deactivate`),
    onSuccess: () => {
      toast.success("Alat kesehatan dinonaktifkan")
      qc.invalidateQueries({ queryKey: ["equipment"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menonaktifkan alat kesehatan"),
  })

  const approveLoanMutation = useMutation({
    mutationFn: (id: string) => api.put(`/equipment/loans/${id}/approve`),
    onSuccess: () => {
      toast.success("Peminjaman disetujui")
      qc.invalidateQueries({ queryKey: ["equipment-loans"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menyetujui peminjaman"),
  })

  const rejectLoanMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.put(`/equipment/loans/${id}/reject`, { notes }),
    onSuccess: () => {
      toast.success("Peminjaman ditolak")
      qc.invalidateQueries({ queryKey: ["equipment-loans"] })
      setConfirmAction(null)
      setRejectNotes("")
    },
    onError: () => toast.error("Gagal menolak peminjaman"),
  })

  const equipmentColumns: ColumnDef<MedicalEquipment>[] = [
    {
      id: "photo",
      header: "Foto",
      cell: ({ row }) =>
        row.original.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getMediaUrl(row.original.photo_url)}
            alt={row.original.name}
            className="h-10 w-10 rounded object-cover border border-gray-200"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            —
          </div>
        ),
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => (
        <Link
          href={`/equipment/${row.original.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700 capitalize">{row.original.category}</span>
      ),
    },
    {
      accessorKey: "condition",
      header: "Kondisi",
      cell: ({ row }) => <StatusBadge status={row.original.condition} />,
    },
    {
      accessorKey: "total_stock",
      header: "Total Stok",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.total_stock}</span>
      ),
    },
    {
      accessorKey: "available_stock",
      header: "Tersedia",
      cell: ({ row }) => (
        <span
          className={`text-sm font-medium ${row.original.available_stock === 0 ? "text-red-600" : "text-emerald-600"
            }`}
        >
          {row.original.available_stock}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_active ? "active" : "cancelled"} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const e = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/equipment/${e.id}`}>Lihat Detail</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/equipment/${e.id}?edit=true`}>Edit</Link>
              </DropdownMenuItem>
              {e.is_active && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() =>
                      setConfirmAction({ type: "deactivate", id: e.id, name: e.name })
                    }
                  >
                    Nonaktifkan
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const loanColumns: ColumnDef<EquipmentLoan>[] = [
    {
      accessorKey: "equipment_id",
      header: "ID Alat",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-500">{row.original.equipment_id}</span>
      ),
    },
    {
      accessorKey: "borrower_name",
      header: "Peminjam",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.original.borrower_name}</p>
          <p className="text-xs text-gray-500">{row.original.borrower_phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "borrow_date",
      header: "Tanggal Pinjam",
      cell: ({ row }) => formatDate(row.original.borrow_date),
    },
    {
      accessorKey: "return_date",
      header: "Tanggal Kembali",
      cell: ({ row }) => formatDate(row.original.return_date),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const l = row.original
        if (l.status !== "pending") return null
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs"
              onClick={() => setConfirmAction({ type: "approve_loan", id: l.id })}
            >
              Setujui
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={() => setConfirmAction({ type: "reject_loan", id: l.id })}
            >
              Tolak
            </Button>
          </div>
        )
      },
    },
  ]

  const filteredEquipment = equipment.filter(
    (e) =>
      !searchEquipment ||
      e.name.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      e.category.toLowerCase().includes(searchEquipment.toLowerCase())
  )

  const filteredLoans = loans.filter(
    (l) =>
      !searchLoans ||
      l.borrower_name.toLowerCase().includes(searchLoans.toLowerCase()) ||
      l.borrower_phone.toLowerCase().includes(searchLoans.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alat Kesehatan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola inventaris dan peminjaman alat kesehatan</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["equipment"] })
            qc.invalidateQueries({ queryKey: ["equipment-loans"] })
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Alkes"
          value={metricsLoading ? "—" : formatNumber(metrics?.total_equipment ?? 0)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Sedang Dipinjam"
          value={metricsLoading ? "—" : formatNumber(metrics?.on_loan ?? 0)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Permintaan Pending"
          value={metricsLoading ? "—" : formatNumber(metrics?.pending_loans ?? 0)}
          loading={metricsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Berdasarkan Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <DonutChart
                data={(metrics?.by_category ?? []).map((c) => ({
                  name: c.category,
                  value: c.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Berdasarkan Kondisi</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <DonutChart
                data={(metrics?.by_condition ?? []).map((c) => ({
                  name: c.condition,
                  value: c.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="katalog">
        <TabsList>
          <TabsTrigger value="katalog">Katalog</TabsTrigger>
          <TabsTrigger value="pinjaman">Pinjaman</TabsTrigger>
        </TabsList>

        <TabsContent value="katalog" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {(equipError || metricsError) && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Gagal memuat data peralatan. Silakan refresh halaman.
                </div>
              )}
              <DataTableToolbar
                globalFilter={searchEquipment}
                onGlobalFilterChange={setSearchEquipment}
                placeholder="Cari nama atau kategori..."
              />
              <DataTable
                columns={equipmentColumns}
                data={filteredEquipment}
                loading={equipLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pinjaman" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {loansError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Gagal memuat data peminjaman peralatan. Silakan refresh halaman.
                </div>
              )}
              <DataTableToolbar
                globalFilter={searchLoans}
                onGlobalFilterChange={setSearchLoans}
                placeholder="Cari nama atau nomor HP peminjam..."
              />
              <DataTable
                columns={loanColumns}
                data={filteredLoans}
                loading={loansLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deactivate equipment confirm */}
      <ConfirmDialog
        open={confirmAction?.type === "deactivate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Nonaktifkan Alat"
        description={`Nonaktifkan "${confirmAction?.name}"? Alat tidak akan tersedia untuk dipinjam.`}
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate(confirmAction!.id)}
      />

      {/* Approve loan confirm */}
      <ConfirmDialog
        open={confirmAction?.type === "approve_loan"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Setujui Peminjaman"
        description="Setujui permintaan peminjaman alat kesehatan ini?"
        confirmLabel="Setujui"
        loading={approveLoanMutation.isPending}
        onConfirm={() => approveLoanMutation.mutate(confirmAction!.id)}
      />

      {/* Reject loan confirm */}
      <ConfirmDialog
        open={confirmAction?.type === "reject_loan"}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmAction(null)
            setRejectNotes("")
          }
        }}
        title="Tolak Peminjaman"
        description="Tolak permintaan peminjaman ini?"
        confirmLabel="Tolak"
        variant="destructive"
        loading={rejectLoanMutation.isPending}
        onConfirm={() =>
          rejectLoanMutation.mutate({ id: confirmAction!.id, notes: rejectNotes })
        }
      />
    </div>
  )
}
