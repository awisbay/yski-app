"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import type { Donation } from "@/types"

export default function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)

  const { data: donation, isLoading } = useQuery({
    queryKey: ["donation", id],
    queryFn: () => api.get<Donation>(`/donations/${id}`).then((r) => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: () => api.post(`/donations/${id}/verify`),
    onSuccess: () => {
      toast.success("Donasi berhasil diverifikasi")
      qc.invalidateQueries({ queryKey: ["donation", id] })
      qc.invalidateQueries({ queryKey: ["donations"] })
      setShowVerifyDialog(false)
    },
    onError: () => toast.error("Gagal memverifikasi donasi"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!donation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">Donasi tidak ditemukan</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  const isVerified = !!donation.verified_by
  const canVerify =
    (donation.payment_status === "pending" || donation.payment_status === "paid") && !isVerified

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Donasi</h1>
          <p className="text-sm text-gray-500 font-mono">{donation.donation_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Informasi Donatur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Nama Donatur</p>
              <p className="text-sm font-semibold text-gray-900">{donation.donor_name}</p>
            </div>

            {donation.donor_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{donation.donor_email}</span>
              </div>
            )}

            {donation.donor_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{donation.donor_phone}</span>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Jumlah</p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatCurrency(donation.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Jenis Donasi</p>
                <StatusBadge status={donation.donation_type} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="capitalize">{donation.payment_method}</span>
            </div>

            {donation.message && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Pesan</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 italic">
                  &ldquo;{donation.message}&rdquo;
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Dibuat: {formatDate(donation.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status & Verification Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={donation.payment_status} />
              </div>

              {donation.proof_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Bukti Pembayaran</p>
                  <a
                    href={donation.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Lihat Bukti Bayar
                  </a>
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <img
                      src={donation.proof_url}
                      alt="Bukti Pembayaran"
                      className="w-full max-h-48 object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Verifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isVerified ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Sudah Diverifikasi</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="text-gray-400">Oleh:</span>{" "}
                      <span className="font-mono text-xs">{donation.verified_by}</span>
                    </p>
                    <p>
                      <span className="text-gray-400">Pada:</span>{" "}
                      {formatDateTime(donation.verified_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Donasi ini belum diverifikasi.</p>
                  {canVerify && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                      onClick={() => setShowVerifyDialog(true)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verifikasi Donasi
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showVerifyDialog}
        onOpenChange={(o) => !o && setShowVerifyDialog(false)}
        title="Verifikasi Donasi"
        description={`Verifikasi donasi dari ${donation.donor_name} sebesar ${formatCurrency(donation.amount)}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Verifikasi"
        loading={verifyMutation.isPending}
        onConfirm={() => verifyMutation.mutate()}
      />
    </div>
  )
}
