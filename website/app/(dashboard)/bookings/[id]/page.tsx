"use client"

import { use, useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Phone, User, Star, Navigation2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatDate, formatDateTime } from "@/lib/utils"
import type { MovingBooking } from "@/types"

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [isFetchingRoute, setIsFetchingRoute] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get<MovingBooking>(`/bookings/${id}`).then((r) => r.data),
  })

  useEffect(() => {
    if (!booking || !booking.pickup_lat || !booking.pickup_lng || !booking.dropoff_lat || !booking.dropoff_lng) {
      return
    }

    let cancelled = false
    setIsFetchingRoute(true)

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${booking.pickup_lng},${booking.pickup_lat};${booking.dropoff_lng},${booking.dropoff_lat}?overview=false`
        const res = await fetch(url)
        const data = await res.json()
        if (data.code !== "Ok" || !data.routes?.length) return

        if (!cancelled) {
          const route = data.routes[0]
          setRouteInfo({
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMin: Math.round((route.duration / 60) * 1.4),
          })
        }
      } catch (e) {
        // ignore validation errors for route
      } finally {
        if (!cancelled) {
          setIsFetchingRoute(false)
        }
      }
    }

    fetchRoute()

    return () => { cancelled = true }
  }, [booking])

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/approve`),
    onSuccess: () => {
      toast.success("Pemesanan disetujui")
      qc.invalidateQueries({ queryKey: ["booking", id] })
      qc.invalidateQueries({ queryKey: ["bookings"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menyetujui pemesanan"),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Pemesanan ditolak")
      qc.invalidateQueries({ queryKey: ["booking", id] })
      qc.invalidateQueries({ queryKey: ["bookings"] })
      setConfirmAction(null)
      setRejectReason("")
    },
    onError: () => toast.error("Gagal menolak pemesanan"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Pemesanan tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Detail Pemesanan
          </h1>
          <p className="text-sm text-gray-500 font-mono">{booking.booking_code}</p>
        </div>
        <StatusBadge status={booking.status} className="ml-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Pemesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Tanggal</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(booking.booking_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Slot Waktu</Label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{booking.time_slot}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-gray-500">Keperluan</Label>
                <p className="text-sm text-gray-900 mt-1">{booking.purpose}</p>
              </div>

              {booking.notes && (
                <div>
                  <Label className="text-xs text-gray-500">Catatan</Label>
                  <p className="text-sm text-gray-700 mt-1">{booking.notes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <Label className="text-xs text-gray-500">Alamat Penjemputan</Label>
                    <p className="text-sm text-gray-900 mt-0.5">{booking.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <Label className="text-xs text-gray-500">Alamat Tujuan</Label>
                    <p className="text-sm text-gray-900 mt-0.5">{booking.dropoff_address}</p>
                  </div>
                </div>

                {isFetchingRoute ? (
                  <div className="flex items-start gap-3 mt-4 pt-3 border-t border-gray-100">
                    <Navigation2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div>
                      <Label className="text-xs text-gray-500">Estimasi Perjalanan</Label>
                      <p className="text-sm text-gray-500 mt-0.5">Menghitung rute...</p>
                    </div>
                  </div>
                ) : routeInfo ? (
                  <div className="flex items-start gap-3 mt-4 pt-3 border-t border-gray-100">
                    <Navigation2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <Label className="text-xs text-gray-500">Estimasi Perjalanan</Label>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {routeInfo.distanceKm} km
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="font-normal text-gray-600">±{routeInfo.durationMin} menit</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status saat ini</span>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Dibuat</span>
                <span className="text-gray-900">{formatDateTime(booking.created_at)}</span>
              </div>
              {booking.approved_by && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Disetujui oleh</span>
                  <span className="text-gray-900">{booking.approved_by}</span>
                </div>
              )}
              {booking.assigned_to_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ditugaskan kepada</span>
                  <span className="text-gray-900">{booking.assigned_to_name}</span>
                </div>
              )}
              {booking.rejection_reason && (
                <div>
                  <span className="text-sm text-gray-500">Alasan penolakan</span>
                  <p className="text-sm text-red-600 mt-1 bg-red-50 rounded p-2">{booking.rejection_reason}</p>
                </div>
              )}
              {booking.updated_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Diperbarui</span>
                  <span className="text-gray-900">{formatDateTime(booking.updated_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          {booking.status === "completed" && booking.rating !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Ulasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < (booking.rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">{booking.rating}/5</span>
                </div>
                {booking.review_text && (
                  <p className="text-sm text-gray-600 italic">"{booking.review_text}"</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Pemohon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Nama</Label>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{booking.requester_name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{booking.requester_phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {booking.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tindakan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setConfirmAction("approve")}
                >
                  Setujui Pemesanan
                </Button>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Alasan penolakan</Label>
                  <Textarea
                    placeholder="Tuliskan alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmAction("reject")}
                    disabled={!rejectReason.trim()}
                  >
                    Tolak Pemesanan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Setujui Pemesanan"
        description={`Setujui pemesanan ${booking.booking_code} dari ${booking.requester_name}?`}
        confirmLabel="Setujui"
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmAction(null)
          }
        }}
        title="Tolak Pemesanan"
        description={`Tolak pemesanan ${booking.booking_code}? Alasan: "${rejectReason}"`}
        confirmLabel="Tolak"
        variant="destructive"
        loading={rejectMutation.isPending}
        onConfirm={() => rejectMutation.mutate(rejectReason)}
      />
    </div>
  )
}
