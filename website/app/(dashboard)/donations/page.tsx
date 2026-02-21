"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle, Eye } from "lucide-react"
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
import { AreaChart } from "@/components/charts/AreaChart"
import { DonutChart } from "@/components/charts/DonutChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ExportButton } from "@/components/shared/ExportButton"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import type { Donation, DonationMetrics } from "@/types"

const DONATION_TYPES = ["all", "infaq", "sedekah", "wakaf", "zakat"] as const
const PAYMENT_STATUSES = ["all", "pending", "paid", "cancelled", "refunded"] as const

type DonationTypeFilter = (typeof DONATION_TYPES)[number]
type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number]

function useDonations(donationType: DonationTypeFilter, paymentStatus: PaymentStatusFilter) {
  return useQuery({
    queryKey: ["donations", donationType, paymentStatus],
    queryFn: () =>
      api
        .get<Donation[]>("/donations", {
          params: {
            skip: 0,
            limit: 200,
            donation_type: donationType !== "all" ? donationType : undefined,
            payment_status: paymentStatus !== "all" ? paymentStatus : undefined,
          },
        })
        .then((r) => r.data),
  })
}

function useDonationMetrics() {
  return useQuery({
    queryKey: ["dashboard", "donations", "metrics"],
    queryFn: () => api.get<DonationMetrics>("/dashboard/donations/metrics").then((r) => r.data),
  })
}

export default function DonationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [donationType, setDonationType] = useState<DonationTypeFilter>("all")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter>("all")
  const [verifyTarget, setVerifyTarget] = useState<Donation | null>(null)

  const { data: donations = [], isLoading } = useDonations(donationType, paymentStatus)
  const { data: metrics, isLoading: metricsLoading } = useDonationMetrics()

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.post(`/donations/${id}/verify`),
    onSuccess: () => {
      toast.success("Donasi berhasil diverifikasi")
      qc.invalidateQueries({ queryKey: ["donations"] })
      qc.invalidateQueries({ queryKey: ["dashboard", "donations", "metrics"] })
      setVerifyTarget(null)
    },
    onError: () => toast.error("Gagal memverifikasi donasi"),
  })

  const filteredDonations = search
    ? donations.filter(
        (d) =>
          d.donor_name.toLowerCase().includes(search.toLowerCase()) ||
          d.donation_code.toLowerCase().includes(search.toLowerCase())
      )
    : donations

  const columns: ColumnDef<Donation>[] = [
    {
      accessorKey: "donation_code",
      header: "Kode",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-700">{row.original.donation_code}</span>
      ),
    },
    {
      accessorKey: "donor_name",
      header: "Donatur",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.donor_name}</span>
      ),
    },
    {
      accessorKey: "donation_type",
      header: "Jenis",
      cell: ({ row }) => <StatusBadge status={row.original.donation_type} />,
    },
    {
      accessorKey: "amount",
      header: "Jumlah",
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Metode Bayar",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 capitalize">{row.original.payment_method}</span>
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Status Bayar",
      cell: ({ row }) => <StatusBadge status={row.original.payment_status} />,
    },
    {
      accessorKey: "verified_by",
      header: "Diverifikasi Oleh",
      cell: ({ row }) => {
        const v = row.original.verified_by
        return <span className="text-sm text-gray-600">{v ? v.slice(0, 8) + "..." : "—"}</span>
      },
    },
    {
      accessorKey: "created_at",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const d = row.original
        const canVerify =
          (d.payment_status === "pending" || d.payment_status === "paid") && !d.verified_by
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/donations/${d.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {canVerify && (
              <Button
                size="sm"
                className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                onClick={() => setVerifyTarget(d)}
              >
                <CheckCircle className="h-3 w-3" />
                Verifikasi
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const exportData = filteredDonations.map((d) => ({
    Kode: d.donation_code,
    Donatur: d.donor_name,
    Jenis: d.donation_type,
    Jumlah: d.amount,
    "Metode Bayar": d.payment_method,
    "Status Bayar": d.payment_status,
    "Diverifikasi Oleh": d.verified_by ?? "",
    "Diverifikasi Pada": d.verified_at ? format(new Date(d.verified_at), "dd/MM/yyyy HH:mm") : "",
    Tanggal: format(new Date(d.created_at), "dd/MM/yyyy"),
  }))

  const infaqTotal =
    metrics?.by_type?.find((t) => t.type === "infaq")?.amount ?? 0
  const sedekahTotal =
    metrics?.by_type?.find((t) => t.type === "sedekah")?.amount ?? 0
  const zakatTotal =
    metrics?.by_type?.find((t) => t.type === "zakat")?.amount ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Donasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan verifikasi semua donasi masuk</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Donasi"
          value={metricsLoading ? "—" : formatCurrency(metrics?.total_amount ?? 0)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Infaq"
          value={metricsLoading ? "—" : formatCurrency(infaqTotal)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Sedekah"
          value={metricsLoading ? "—" : formatCurrency(sedekahTotal)}
          loading={metricsLoading}
        />
        <MetricCard
          title="Zakat"
          value={metricsLoading ? "—" : formatCurrency(zakatTotal)}
          loading={metricsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tren Donasi Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <AreaChart
                data={metrics?.monthly_trend ?? []}
                xKey="label"
                yKey="amount"
                label="Jumlah Donasi"
                formatter={(v) => formatCurrency(v)}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Berdasarkan Jenis</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-[220px]" />
            ) : (
              <DonutChart
                data={(metrics?.by_type ?? []).map((t) => ({ name: t.type, value: t.amount }))}
                formatter={(v) => formatCurrency(v)}
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
            placeholder="Cari donatur atau kode..."
            actions={
              <div className="flex items-center gap-2">
                <Select
                  value={donationType}
                  onValueChange={(v) => setDonationType(v as DonationTypeFilter)}
                >
                  <SelectTrigger className="h-9 w-36 text-sm">
                    <SelectValue placeholder="Jenis Donasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="infaq">Infaq</SelectItem>
                    <SelectItem value="sedekah">Sedekah</SelectItem>
                    <SelectItem value="wakaf">Wakaf</SelectItem>
                    <SelectItem value="zakat">Zakat</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => setPaymentStatus(v as PaymentStatusFilter)}
                >
                  <SelectTrigger className="h-9 w-40 text-sm">
                    <SelectValue placeholder="Status Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Terbayar</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    <SelectItem value="refunded">Dikembalikan</SelectItem>
                  </SelectContent>
                </Select>
                <ExportButton
                  data={exportData}
                  filename={`donasi-${format(new Date(), "yyyyMMdd")}`}
                />
              </div>
            }
          />
          <DataTable columns={columns} data={filteredDonations} loading={isLoading} />
          <p className="text-xs text-gray-400 text-right">
            Menampilkan {formatNumber(filteredDonations.length)} donasi
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!verifyTarget}
        onOpenChange={(o) => !o && setVerifyTarget(null)}
        title="Verifikasi Donasi"
        description={`Verifikasi donasi dari ${verifyTarget?.donor_name} sebesar ${verifyTarget ? formatCurrency(verifyTarget.amount) : ""}?`}
        confirmLabel="Verifikasi"
        loading={verifyMutation.isPending}
        onConfirm={() => verifyMutation.mutate(verifyTarget!.id)}
      />
    </div>
  )
}
