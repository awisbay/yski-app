"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Users, Heart, Gavel, Truck, Package, Clock, FileText, Newspaper, LayoutGrid,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/charts/MetricCard"
import { AreaChart } from "@/components/charts/AreaChart"
import { BarChart } from "@/components/charts/BarChart"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { DashboardOverview, FinancialReport, NewsArticle, Program } from "@/types"

function useOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => api.get<DashboardOverview>("/dashboard/overview"),
  })
}

function useNewsSummary() {
  return useQuery({
    queryKey: ["dashboard", "overview", "news-summary"],
    queryFn: () => api.get<NewsArticle[]>("/content/news", { params: { skip: 0, limit: 200 } }),
  })
}

function useProgramSummary() {
  return useQuery({
    queryKey: ["dashboard", "overview", "program-summary"],
    queryFn: () => api.get<Program[]>("/content/programs", { params: { skip: 0, limit: 200 } }),
  })
}

function useFinanceSummary() {
  return useQuery({
    queryKey: ["dashboard", "overview", "finance-summary"],
    queryFn: () => api.get<FinancialReport[]>("/financial/reports", { params: { skip: 0, limit: 200 } }),
  })
}

const QUICK_ACTIONS = [
  { label: "Donasi Menunggu Verifikasi", href: "/donations?status=pending", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  { label: "Booking Pickup Menunggu Persetujuan", href: "/bookings?status=pending", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { label: "Request Penjemputan Menunggu Proses", href: "/pickups?status=pending", color: "bg-cyan-50 border-cyan-200 text-cyan-800" },
  { label: "Artikel Menunggu Review", href: "/content?tab=news&status=pending_review", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { label: "Pengajuan Pinjaman Alkes", href: "/equipment?tab=loans&status=pending", color: "bg-purple-50 border-purple-200 text-purple-800" },
]

export default function OverviewPage() {
  const { data, isLoading, isError } = useOverview()
  const { data: news = [] } = useNewsSummary()
  const { data: programs = [] } = useProgramSummary()
  const { data: reports = [] } = useFinanceSummary()
  const totals = data?.totals

  const featureSummary = [
    {
      title: "Manajemen User",
      href: "/users",
      icon: Users,
      value: formatNumber(totals?.users ?? 0),
      note: `${formatNumber(totals?.active_users ?? 0)} pengguna aktif`,
    },
    {
      title: "Cek Bookingan Pickup",
      href: "/bookings",
      icon: Truck,
      value: formatNumber(totals?.pending_bookings ?? 0),
      note: "booking menunggu persetujuan",
    },
    {
      title: "Manajemen Donasi",
      href: "/donations",
      icon: Heart,
      value: formatCurrency(totals?.donations_amount ?? 0),
      note: "akumulasi donasi terverifikasi",
    },
    {
      title: "Cek Request Penjemputan",
      href: "/pickups",
      icon: Clock,
      value: formatNumber(totals?.pending_pickups ?? 0),
      note: "request penjemputan pending",
    },
    {
      title: "Manajemen Peralatan",
      href: "/equipment",
      icon: Package,
      value: formatNumber(totals?.equipment_on_loan ?? 0),
      note: "alat sedang dipinjam",
    },
    {
      title: "Lelang",
      href: "/auctions",
      icon: Gavel,
      value: formatNumber(totals?.active_auctions ?? 0),
      note: "lelang aktif",
    },
    {
      title: "Manajemen Program",
      href: "/content?tab=program",
      icon: LayoutGrid,
      value: formatNumber(programs.length),
      note: "program terdaftar",
    },
    {
      title: "Manajemen Berita",
      href: "/content?tab=news",
      icon: Newspaper,
      value: formatNumber(news.length),
      note: "artikel tersedia",
    },
    {
      title: "Keuangan",
      href: "/finance",
      icon: FileText,
      value: formatNumber(reports.length),
      note: "laporan keuangan tercatat",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan seluruh aktivitas YSKI</p>
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">
            Data overview belum berhasil dimuat. Silakan refresh halaman.
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Pengguna"
          value={isLoading ? "—" : formatNumber(totals?.users ?? 0)}
          icon={Users}
          description={isLoading ? "" : `${formatNumber(totals?.active_users ?? 0)} aktif`}
          loading={isLoading}
        />
        <MetricCard
          title="Total Donasi"
          value={isLoading ? "—" : formatCurrency(totals?.donations_amount ?? 0)}
          icon={Heart}
          loading={isLoading}
        />
        <MetricCard
          title="Lelang Aktif"
          value={isLoading ? "—" : formatNumber(totals?.active_auctions ?? 0)}
          icon={Gavel}
          loading={isLoading}
        />
        <MetricCard
          title="Booking Pickup Pending"
          value={isLoading ? "—" : formatNumber(totals?.pending_bookings ?? 0)}
          icon={Truck}
          loading={isLoading}
        />
        <MetricCard
          title="Alkes Dipinjam"
          value={isLoading ? "—" : formatNumber(totals?.equipment_on_loan ?? 0)}
          icon={Package}
          loading={isLoading}
        />
        <MetricCard
          title="Pickup Pending"
          value={isLoading ? "—" : formatNumber(totals?.pending_pickups ?? 0)}
          icon={Clock}
          loading={isLoading}
        />
      </div>

      {/* Feature summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Summary Fitur & Fasilitas Web</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featureSummary.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{isLoading ? "—" : item.value}</p>
                <p className="mt-1 text-xs text-gray-500">{item.note}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donation Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tren Donasi (12 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <AreaChart
                data={data?.donation_trend ?? []}
                xKey="label"
                yKey="amount"
                label="Donasi"
                formatter={(v) => formatCurrency(v)}
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tindakan Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${action.color}`}
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Booking Pickup Berdasarkan Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                data={(data?.bookings_by_status ?? []).map((b) => ({
                  status: b.status,
                  count: b.count,
                }))}
                xKey="status"
                yKey="count"
                label="Booking Pickup"
              />
              <div className="flex flex-col justify-center gap-2">
                {(data?.bookings_by_status ?? []).map((b) => (
                  <div key={b.status} className="flex items-center justify-between text-sm">
                    <StatusBadge status={b.status} />
                    <span className="font-semibold text-gray-900">{formatNumber(b.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
