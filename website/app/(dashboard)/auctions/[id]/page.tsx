"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
  Gavel,
  Clock,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import type { AuctionItem, AuctionBid } from "@/types"

type BidAction = { bid: AuctionBid; action: "approve" | "reject" }

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [bidAction, setBidAction] = useState<BidAction | null>(null)
  const [showVerifyPayment, setShowVerifyPayment] = useState(false)

  const { data: auction, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: () => api.get<AuctionItem>(`/auctions/${id}`),
  })

  const { data: bids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ["auction", id, "bids"],
    queryFn: () => api.get<AuctionBid[]>(`/auctions/${id}/bids`),
  })

  const approveBidMutation = useMutation({
    mutationFn: (bidId: string) =>
      api.put(`/auctions/${id}/bids/${bidId}/approve`),
    onSuccess: () => {
      toast.success("Penawaran disetujui")
      qc.invalidateQueries({ queryKey: ["auction", id] })
      qc.invalidateQueries({ queryKey: ["auction", id, "bids"] })
      setBidAction(null)
    },
    onError: () => toast.error("Gagal menyetujui penawaran"),
  })

  const rejectBidMutation = useMutation({
    mutationFn: (bidId: string) =>
      api.put(`/auctions/${id}/bids/${bidId}/reject`),
    onSuccess: () => {
      toast.success("Penawaran ditolak")
      qc.invalidateQueries({ queryKey: ["auction", id] })
      qc.invalidateQueries({ queryKey: ["auction", id, "bids"] })
      setBidAction(null)
    },
    onError: () => toast.error("Gagal menolak penawaran"),
  })

  const verifyPaymentMutation = useMutation({
    mutationFn: () => api.post(`/auctions/${id}/verify-payment`),
    onSuccess: () => {
      toast.success("Pembayaran berhasil diverifikasi")
      qc.invalidateQueries({ queryKey: ["auction", id] })
      setShowVerifyPayment(false)
    },
    onError: () => toast.error("Gagal memverifikasi pembayaran"),
  })

  const bidColumns: ColumnDef<AuctionBid>[] = [
    {
      accessorKey: "bidder_id",
      header: "ID Penawar",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-700">
          {row.original.bidder_id.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Jumlah Penawaran",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-700">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: "Waktu",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDateTime(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const bid = row.original
        if (bid.status !== "pending") return null
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
              onClick={() => setBidAction({ bid, action: "approve" })}
            >
              <CheckCircle className="h-3 w-3" />
              Setujui
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 gap-1 text-xs"
              onClick={() => setBidAction({ bid, action: "reject" })}
            >
              <XCircle className="h-3 w-3" />
              Tolak
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">Lelang tidak ditemukan</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    )
  }

  const paymentVerified = !!auction.payment_verified_by
  const canVerifyPayment =
    auction.status === "payment_pending" && auction.payment_proof_url && !paymentVerified

  const activeMutation =
    bidAction?.action === "approve" ? approveBidMutation : rejectBidMutation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Lelang</h1>
        </div>
      </div>

      {/* Auction Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4 text-emerald-600" />
            Informasi Lelang
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{auction.title}</h2>
              {auction.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{auction.description}</p>
              )}
            </div>
            <StatusBadge status={auction.status} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Harga Awal
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(auction.starting_price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Harga Saat Ini</p>
              <p className="text-sm font-bold text-emerald-700">
                {formatCurrency(auction.current_price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Mulai
              </p>
              <p className="text-sm text-gray-700">{formatDateTime(auction.start_time)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Selesai</p>
              <p className="text-sm text-gray-700">{formatDateTime(auction.end_time)}</p>
            </div>
          </div>

          {auction.winner_id && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Pemenang</p>
              <p className="text-sm font-mono text-emerald-700">{auction.winner_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Penawaran</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={bidColumns} data={bids} loading={bidsLoading} />
        </CardContent>
      </Card>

      {/* Payment Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Verifikasi Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auction.payment_proof_url ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">Bukti Pembayaran</p>
                <a
                  href={auction.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lihat Bukti Pembayaran
                </a>
                <div className="mt-3 border rounded-lg overflow-hidden">
                  <img
                    src={auction.payment_proof_url}
                    alt="Bukti Pembayaran"
                    className="w-full max-h-48 object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Belum ada bukti pembayaran yang diunggah.</p>
          )}

          {paymentVerified ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Pembayaran Terverifikasi</span>
              </div>
              <p className="text-xs text-gray-500 pl-7">
                Oleh: <span className="font-mono">{auction.payment_verified_by}</span>
              </p>
              <p className="text-xs text-gray-500 pl-7">
                Pada: {formatDateTime(auction.payment_verified_at)}
              </p>
            </div>
          ) : (
            canVerifyPayment && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={() => setShowVerifyPayment(true)}
              >
                <CheckCircle className="h-4 w-4" />
                Verifikasi Pembayaran
              </Button>
            )
          )}

          {!paymentVerified && !canVerifyPayment && !auction.payment_proof_url && (
            <p className="text-sm text-gray-400">
              Verifikasi pembayaran tersedia setelah pemenang mengunggah bukti pembayaran.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Bid Action Dialog */}
      <ConfirmDialog
        open={!!bidAction}
        onOpenChange={(o) => !o && setBidAction(null)}
        title={bidAction?.action === "approve" ? "Setujui Penawaran" : "Tolak Penawaran"}
        description={
          bidAction?.action === "approve"
            ? `Setujui penawaran sebesar ${bidAction ? formatCurrency(bidAction.bid.amount) : ""}?`
            : `Tolak penawaran sebesar ${bidAction ? formatCurrency(bidAction.bid.amount) : ""}?`
        }
        confirmLabel={bidAction?.action === "approve" ? "Setujui" : "Tolak"}
        variant={bidAction?.action === "reject" ? "destructive" : "default"}
        loading={activeMutation.isPending}
        onConfirm={() => {
          if (!bidAction) return
          if (bidAction.action === "approve") {
            approveBidMutation.mutate(bidAction.bid.id)
          } else {
            rejectBidMutation.mutate(bidAction.bid.id)
          }
        }}
      />

      {/* Confirm Verify Payment Dialog */}
      <ConfirmDialog
        open={showVerifyPayment}
        onOpenChange={(o) => !o && setShowVerifyPayment(false)}
        title="Verifikasi Pembayaran"
        description="Konfirmasi bahwa pembayaran dari pemenang lelang telah diterima dan diverifikasi?"
        confirmLabel="Verifikasi"
        loading={verifyPaymentMutation.isPending}
        onConfirm={() => verifyPaymentMutation.mutate()}
      />
    </div>
  )
}
