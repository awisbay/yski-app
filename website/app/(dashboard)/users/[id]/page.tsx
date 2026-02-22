"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Phone, Shield, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { formatDateTime, formatDate } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types"

const ROLES = ["admin", "pengurus", "relawan", "sahabat"] as const

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { can } = useAuth()
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get<User>(`/users/${id}`),
  })

  const roleChangeMutation = useMutation({
    mutationFn: (role: string) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { toast.success("Role diperbarui"); qc.invalidateQueries({ queryKey: ["user", id] }); setConfirmAction(null) },
    onError: () => toast.error("Gagal mengubah role"),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => api.post(`/users/${id}/deactivate`),
    onSuccess: () => { toast.success("Pengguna dinonaktifkan"); qc.invalidateQueries({ queryKey: ["user", id] }); setConfirmAction(null) },
    onError: () => toast.error("Gagal menonaktifkan"),
  })

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/users/${id}/activate`),
    onSuccess: () => { toast.success("Pengguna diaktifkan"); qc.invalidateQueries({ queryKey: ["user", id] }); setConfirmAction(null) },
    onError: () => toast.error("Gagal mengaktifkan"),
  })

  const resetMutation = useMutation({
    mutationFn: () => api.post(`/users/${id}/reset-password`),
    onSuccess: () => { toast.success("Email reset password terkirim"); setConfirmAction(null) },
    onError: () => toast.error("Gagal mengirim email"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!user) return <div>Pengguna tidak ditemukan</div>

  const initials = user.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Pengguna</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.full_name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={user.role} />
              <StatusBadge status={user.is_active ? "active" : "cancelled"} />
            </div>
            <Separator />
            <div className="w-full space-y-3 text-sm text-left">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Login: {formatDateTime(user.last_login_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Terdaftar: {formatDate(user.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="lg:col-span-2 space-y-4">
          {can("change_role", "users") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ubah Role
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Select
                  defaultValue={user.role}
                  onValueChange={(v) => setSelectedRole(v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => { setSelectedRole(selectedRole || user.role); setConfirmAction("role") }}
                  disabled={!selectedRole || selectedRole === user.role}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Simpan Role
                </Button>
              </CardContent>
            </Card>
          )}

          {can("deactivate", "users") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Zona Berbahaya</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {user.is_active ? (
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmAction("deactivate")}
                  >
                    Nonaktifkan Pengguna
                  </Button>
                ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setConfirmAction("activate")}
                  >
                    Aktifkan Pengguna
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction("reset_password")}
                >
                  Reset Password
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "role"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Ubah Role"
        description={`Ubah role ${user.full_name} menjadi "${selectedRole}"?`}
        confirmLabel="Ubah Role"
        loading={roleChangeMutation.isPending}
        onConfirm={() => roleChangeMutation.mutate(selectedRole)}
      />
      <ConfirmDialog
        open={confirmAction === "deactivate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Nonaktifkan Pengguna"
        description={`Nonaktifkan ${user.full_name}? Pengguna tidak dapat login.`}
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate()}
      />
      <ConfirmDialog
        open={confirmAction === "activate"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Aktifkan Pengguna"
        description={`Aktifkan kembali ${user.full_name}?`}
        confirmLabel="Aktifkan"
        loading={activateMutation.isPending}
        onConfirm={() => activateMutation.mutate()}
      />
      <ConfirmDialog
        open={confirmAction === "reset_password"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Reset Password"
        description={`Kirim email reset password ke ${user.email}?`}
        confirmLabel="Kirim Email"
        loading={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
      />
    </div>
  )
}
