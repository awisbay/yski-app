"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, UserPlus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { DonutChart } from "@/components/charts/DonutChart"
import { BarChart } from "@/components/charts/BarChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ExportButton } from "@/components/shared/ExportButton"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { User, UserMetrics } from "@/types"
import Link from "next/link"

function useUsers(search: string) {
  return useQuery({
    queryKey: ["users", search],
    queryFn: () =>
      api.get<User[]>("/users", { params: { limit: 200, search: search || undefined } }).then((r) => r.data),
  })
}

function useUserMetrics() {
  return useQuery({
    queryKey: ["dashboard", "users", "metrics"],
    queryFn: () => api.get<UserMetrics>("/dashboard/users/metrics").then((r) => r.data),
  })
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: User } | null>(null)

  const { data: users = [], isLoading } = useUsers(search)
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics()

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/deactivate`),
    onSuccess: () => { toast.success("Pengguna dinonaktifkan"); qc.invalidateQueries({ queryKey: ["users"] }); setConfirmAction(null) },
    onError: () => toast.error("Gagal menonaktifkan pengguna"),
  })

  const activateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/activate`),
    onSuccess: () => { toast.success("Pengguna diaktifkan"); qc.invalidateQueries({ queryKey: ["users"] }); setConfirmAction(null) },
    onError: () => toast.error("Gagal mengaktifkan pengguna"),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/reset-password`),
    onSuccess: () => { toast.success("Email reset password telah dikirim"); setConfirmAction(null) },
    onError: () => toast.error("Gagal mengirim email reset"),
  })

  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "Pengguna",
      cell: ({ row }) => {
        const u = row.original
        const initials = u.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/users/${u.id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600">{u.full_name}</Link>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
          </div>
        )
      },
    },
    { accessorKey: "phone", header: "Telepon", cell: ({ row }) => row.original.phone ?? "—" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <StatusBadge status={row.original.role} />,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_active ? "active" : "cancelled"} />
      ),
    },
    {
      accessorKey: "last_login_at",
      header: "Login Terakhir",
      cell: ({ row }) => formatDate(row.original.last_login_at),
    },
    {
      accessorKey: "created_at",
      header: "Terdaftar",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const u = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/users/${u.id}`}>Lihat Detail</Link>
              </DropdownMenuItem>
              {can("edit", "users") && (
                <DropdownMenuItem asChild>
                  <Link href={`/users/${u.id}?edit=true`}>Edit</Link>
                </DropdownMenuItem>
              )}
              {can("deactivate", "users") && (
                <>
                  <DropdownMenuSeparator />
                  {u.is_active ? (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setConfirmAction({ type: "deactivate", user: u })}
                    >
                      Nonaktifkan
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-emerald-600"
                      onClick={() => setConfirmAction({ type: "activate", user: u })}
                    >
                      Aktifkan
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "reset_password", user: u })}>
                    Reset Password
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const exportData = users.map((u) => ({
    "Nama": u.full_name,
    "Email": u.email,
    "Telepon": u.phone ?? "",
    "Role": u.role,
    "Status": u.is_active ? "Aktif" : "Nonaktif",
    "Login Terakhir": u.last_login_at ? format(new Date(u.last_login_at), "dd/MM/yyyy HH:mm") : "",
    "Terdaftar": format(new Date(u.created_at), "dd/MM/yyyy"),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua pengguna sistem</p>
        </div>
        {can("create", "users") && (
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Aktif" value={metricsLoading ? "—" : formatNumber(metrics?.active ?? 0)} loading={metricsLoading} />
        <MetricCard title="Nonaktif" value={metricsLoading ? "—" : formatNumber(metrics?.inactive ?? 0)} loading={metricsLoading} />
        <MetricCard title="Total Pengguna" value={metricsLoading ? "—" : formatNumber((metrics?.active ?? 0) + (metrics?.inactive ?? 0))} loading={metricsLoading} />
        <MetricCard title="Daftar Bulan Ini" value={metricsLoading ? "—" : formatNumber(metrics?.signups_per_month?.at(-1)?.count ?? 0)} loading={metricsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Berdasarkan Role</CardTitle></CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-[220px]" /> : (
              <DonutChart
                data={(metrics?.by_role ?? []).map((r) => ({ name: r.role, value: r.count }))}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pendaftaran Baru (6 Bulan)</CardTitle></CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-[220px]" /> : (
              <BarChart
                data={metrics?.signups_per_month ?? []}
                xKey="label"
                yKey="count"
                label="Pendaftar"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
            placeholder="Cari nama atau email..."
            actions={
              <ExportButton data={exportData} filename={`pengguna-${format(new Date(), "yyyyMMdd")}`} />
            }
          />
          <DataTable columns={columns} data={users} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction?.type === "deactivate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Nonaktifkan Pengguna"
        description={`Nonaktifkan ${confirmAction?.user.full_name}? Pengguna tidak dapat login.`}
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate(confirmAction!.user.id)}
      />
      <ConfirmDialog
        open={confirmAction?.type === "activate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Aktifkan Pengguna"
        description={`Aktifkan kembali ${confirmAction?.user.full_name}?`}
        confirmLabel="Aktifkan"
        loading={activateMutation.isPending}
        onConfirm={() => activateMutation.mutate(confirmAction!.user.id)}
      />
      <ConfirmDialog
        open={confirmAction?.type === "reset_password"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reset Password"
        description={`Kirim email reset password ke ${confirmAction?.user.email}?`}
        confirmLabel="Kirim Email"
        loading={resetPasswordMutation.isPending}
        onConfirm={() => resetPasswordMutation.mutate(confirmAction!.user.id)}
      />
    </div>
  )
}
