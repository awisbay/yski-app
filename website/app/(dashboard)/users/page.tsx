"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, UserPlus } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { User, UserMetrics } from "@/types"
import Link from "next/link"

function useUsers(search: string, role: string, status: string) {
  return useQuery({
    queryKey: ["users", search, role, status],
    queryFn: async () => {
      const response = await api.get<User[]>("/users", {
        params: {
          limit: 100,
          search: search || undefined,
          role: role !== "all" ? role : undefined,
          is_active: status === "all" ? undefined : status === "active",
        },
      })
      return Array.isArray(response) ? response : []
    },
  })
}

function useUserMetrics() {
  return useQuery({
    queryKey: ["dashboard", "users", "metrics"],
    queryFn: () => api.get<UserMetrics>("/dashboard/users/metrics"),
  })
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "pengurus" | "relawan" | "sahabat">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [provinceFilter, setProvinceFilter] = useState<string>("all")
  const [donaturFilter, setDonaturFilter] = useState<"all" | "yes" | "no">("all")
  const [relawanFilter, setRelawanFilter] = useState<"all" | "yes" | "no">("all")
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<"all" | "yes" | "no">("all")
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: User } | null>(null)

  const { data: users = [], isLoading, isError } = useUsers(search, roleFilter, statusFilter)
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics()

  const cityOptions = Array.from(new Set(users.map((u) => u.city?.trim()).filter((v): v is string => !!v))).sort()
  const provinceOptions = Array.from(new Set(users.map((u) => u.province?.trim()).filter((v): v is string => !!v))).sort()

  const filteredUsers = users.filter((u) => {
    if (cityFilter !== "all" && (u.city || "") !== cityFilter) return false
    if (provinceFilter !== "all" && (u.province || "") !== provinceFilter) return false
    if (donaturFilter !== "all" && u.interested_as_donatur !== (donaturFilter === "yes")) return false
    if (relawanFilter !== "all" && u.interested_as_relawan !== (relawanFilter === "yes")) return false
    if (beneficiaryFilter !== "all" && u.wants_beneficiary_survey !== (beneficiaryFilter === "yes")) return false
    return true
  })

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
      id: "kunyah",
      header: "Nama Kunyah",
      cell: ({ row }) => row.original.kunyah_name ?? "—",
    },
    {
      id: "pekerjaan",
      header: "Pekerjaan",
      cell: ({ row }) => row.original.occupation ?? "—",
    },
    {
      id: "domisili",
      header: "Kota / Provinsi",
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="text-gray-900">{row.original.city ?? "—"}</p>
          <p className="text-xs text-gray-500">{row.original.province ?? "—"}</p>
        </div>
      ),
    },
    {
      id: "alamat",
      header: "Alamat",
      cell: ({ row }) => (
        <p className="max-w-[260px] text-sm text-gray-700 line-clamp-2">{row.original.address ?? "—"}</p>
      ),
    },
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
      id: "minat",
      header: "Minat Profil",
      cell: ({ row }) => {
        const u = row.original
        const tags = [
          u.interested_as_donatur ? "Donatur" : null,
          u.interested_as_relawan ? "Relawan" : null,
          u.wants_beneficiary_survey ? "Penerima Manfaat" : null,
        ].filter(Boolean) as string[]
        if (!tags.length) return <span className="text-xs text-gray-400">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                {tag}
              </span>
            ))}
          </div>
        )
      },
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
    "Nama Kunyah": u.kunyah_name ?? "",
    "Email": u.email,
    "Telepon": u.phone ?? "",
    "Pekerjaan": u.occupation ?? "",
    "Alamat": u.address ?? "",
    "Kota": u.city ?? "",
    "Provinsi": u.province ?? "",
    "Berminat Donatur": u.interested_as_donatur ? "Ya" : "Tidak",
    "Berminat Relawan": u.interested_as_relawan ? "Ya" : "Tidak",
    "Ingin Penerima Manfaat": u.wants_beneficiary_survey ? "Ya" : "Tidak",
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
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Gagal memuat data pengguna. Coba refresh halaman.
            </div>
          )}
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
            placeholder="Cari nama atau email..."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="h-9 w-[130px] text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pengurus">Pengurus</SelectItem>
                    <SelectItem value="relawan">Relawan</SelectItem>
                    <SelectItem value="sahabat">Sahabat</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="h-9 w-[130px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-9 w-[130px] text-xs">
                    <SelectValue placeholder="Kota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kota</SelectItem>
                    {cityOptions.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="h-9 w-[150px] text-xs">
                    <SelectValue placeholder="Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {provinceOptions.map((province) => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={donaturFilter} onValueChange={(v) => setDonaturFilter(v as typeof donaturFilter)}>
                  <SelectTrigger className="h-9 w-[150px] text-xs">
                    <SelectValue placeholder="Minat Donatur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Donatur: Semua</SelectItem>
                    <SelectItem value="yes">Donatur: Ya</SelectItem>
                    <SelectItem value="no">Donatur: Tidak</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={relawanFilter} onValueChange={(v) => setRelawanFilter(v as typeof relawanFilter)}>
                  <SelectTrigger className="h-9 w-[150px] text-xs">
                    <SelectValue placeholder="Minat Relawan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Relawan: Semua</SelectItem>
                    <SelectItem value="yes">Relawan: Ya</SelectItem>
                    <SelectItem value="no">Relawan: Tidak</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={beneficiaryFilter} onValueChange={(v) => setBeneficiaryFilter(v as typeof beneficiaryFilter)}>
                  <SelectTrigger className="h-9 w-[170px] text-xs">
                    <SelectValue placeholder="Penerima Manfaat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Penerima: Semua</SelectItem>
                    <SelectItem value="yes">Penerima: Ya</SelectItem>
                    <SelectItem value="no">Penerima: Tidak</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton data={exportData} filename={`pengguna-${format(new Date(), "yyyyMMdd")}`} />
              </div>
            }
          />
          <DataTable columns={columns} data={filteredUsers} loading={isLoading} />
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
