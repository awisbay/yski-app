"use client"

import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import type { FinancialReport, FinancialEntry } from "@/types"

const CATEGORIES = [
  "donasi", "infaq", "zakat", "wakaf", "operasional", "gaji",
  "pembelian_alat", "kegiatan", "lain_lain",
]

interface AddEntryForm {
  category: string
  type: "income" | "expense" | ""
  amount: string
  description: string
  entry_date: string
}

export default function FinanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [entryForm, setEntryForm] = useState<AddEntryForm>({
    category: "",
    type: "",
    amount: "",
    description: "",
    entry_date: "",
  })

  const { data: report, isLoading } = useQuery({
    queryKey: ["financial-report", id],
    queryFn: () => api.get<FinancialReport>(`/financial/reports/${id}`),
  })

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["financial-entries", id],
    queryFn: () =>
      api
        .get<FinancialEntry[]>(`/financial/reports/${id}/entries`)
        ,
  })

  const publishMutation = useMutation({
    mutationFn: () =>
      report?.is_published
        ? api.post(`/financial/reports/${id}/unpublish`)
        : api.post(`/financial/reports/${id}/publish`),
    onSuccess: () => {
      toast.success(report?.is_published ? "Laporan tidak dipublikasikan" : "Laporan dipublikasikan")
      qc.invalidateQueries({ queryKey: ["financial-report", id] })
      qc.invalidateQueries({ queryKey: ["financial-reports"] })
    },
    onError: () => toast.error("Gagal mengubah status publikasi"),
  })

  const addEntryMutation = useMutation({
    mutationFn: (data: Omit<AddEntryForm, "amount"> & { amount: number }) =>
      api.post(`/financial/reports/${id}/entries`, data),
    onSuccess: () => {
      toast.success("Entri keuangan ditambahkan")
      qc.invalidateQueries({ queryKey: ["financial-entries", id] })
      qc.invalidateQueries({ queryKey: ["financial-report", id] })
      setSheetOpen(false)
      setEntryForm({ category: "", type: "", amount: "", description: "", entry_date: "" })
    },
    onError: () => toast.error("Gagal menambahkan entri keuangan"),
  })

  function handleAddEntry() {
    if (!entryForm.category || !entryForm.type || !entryForm.amount || !entryForm.entry_date) {
      toast.error("Harap isi semua kolom wajib")
      return
    }
    addEntryMutation.mutate({
      ...entryForm,
      type: entryForm.type as "income" | "expense",
      amount: parseFloat(entryForm.amount),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Laporan tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  const net = report.total_income - report.total_expense

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <p className="text-sm text-gray-500">
              {formatDate(report.period_start)} — {formatDate(report.period_end)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {report.is_published ? "Sembunyikan" : "Publikasikan"}
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Entri
          </Button>
        </div>
      </div>

      {/* Report header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Total Pemasukan</Label>
              <p className="text-lg font-bold text-emerald-700 mt-1">
                {formatCurrency(report.total_income)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Total Pengeluaran</Label>
              <p className="text-lg font-bold text-red-600 mt-1">
                {formatCurrency(report.total_expense)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Saldo Bersih</Label>
              <p className={`text-lg font-bold mt-1 ${net >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {net >= 0 ? "+" : ""}{formatCurrency(net)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">Status Audit:</Label>
                <StatusBadge status={report.is_audited ? "approved" : "pending"} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">Publikasi:</Label>
                <StatusBadge status={report.is_published ? "published" : "draft"} />
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Dibuat: {formatDateTime(report.created_at)}</span>
            <span>Oleh: {report.generated_by}</span>
          </div>
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entri Keuangan</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Belum ada entri keuangan</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSheetOpen(true)}
              >
                Tambah Entri Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Jenis</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-700">{formatDate(entry.entry_date)}</td>
                      <td className="py-3 text-gray-700 capitalize">{entry.category}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-medium ${entry.type === "income" ? "text-emerald-700" : "text-red-600"}`}>
                        {entry.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                      </td>
                      <td className="py-3 text-gray-500 max-w-[200px] truncate">
                        {entry.description ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add entry sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Tambah Entri Keuangan</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Tanggal <span className="text-red-500">*</span></Label>
              <Input
                id="entry_date"
                type="date"
                value={entryForm.entry_date}
                onChange={(e) => setEntryForm((f) => ({ ...f, entry_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select
                value={entryForm.category}
                onValueChange={(v) => setEntryForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis <span className="text-red-500">*</span></Label>
              <Select
                value={entryForm.type}
                onValueChange={(v) => setEntryForm((f) => ({ ...f, type: v as "income" | "expense" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp) <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="0"
                value={entryForm.amount}
                onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi entri keuangan..."
                rows={3}
                value={entryForm.description}
                onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAddEntry}
              disabled={addEntryMutation.isPending}
            >
              {addEntryMutation.isPending ? "Menyimpan..." : "Simpan Entri"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
