"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, CheckCircle2, XCircle, Download, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { MetricCard } from "@/components/charts/MetricCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import api from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type {
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionList,
  FinancialBalances,
  CategoryBalance,
} from "@/types"

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCategories() {
  return useQuery({
    queryKey: ["financial-categories"],
    queryFn: () =>
      api.get<FinancialCategory[]>("/financial/categories").then((r) => r.data),
  })
}

function useTransactions(params?: {
  status?: string
  transaction_type?: string
  category_id?: string
  date_from?: string
  date_to?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ["financial-transactions", params],
    queryFn: () =>
      api
        .get<FinancialTransactionList>("/financial/transactions", {
          params: { limit: params?.limit ?? 100, ...params },
        })
        .then((r) => r.data),
  })
}

function useBalances() {
  return useQuery({
    queryKey: ["financial-balances"],
    queryFn: () =>
      api.get<FinancialBalances>("/financial/balances").then((r) => r.data),
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { can } = useAuth()

  const { data: balances, isLoading: balancesLoading } = useBalances()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola transaksi, kategori, dan laporan keuangan
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Pemasukan"
          value={balancesLoading ? "—" : formatCurrency(balances?.total_credit ?? 0)}
          loading={balancesLoading}
          description="Akumulasi semua kategori"
        />
        <MetricCard
          title="Total Pengeluaran"
          value={balancesLoading ? "—" : formatCurrency(balances?.total_debit ?? 0)}
          loading={balancesLoading}
          description="Akumulasi semua kategori"
        />
        <MetricCard
          title="Saldo Saat Ini"
          value={balancesLoading ? "—" : formatCurrency(balances?.current_balance ?? 0)}
          loading={balancesLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transaksi">
        <TabsList>
          <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
          <TabsTrigger value="laporan">Laporan per Kategori</TabsTrigger>
          <TabsTrigger value="buku-kas">Laporan Keuangan</TabsTrigger>
        </TabsList>

        <TabsContent value="transaksi" className="mt-4">
          <TransactionTab />
        </TabsContent>

        <TabsContent value="kategori" className="mt-4">
          <CategoryTab />
        </TabsContent>

        <TabsContent value="laporan" className="mt-4">
          <ReportTab balances={balances} balancesLoading={balancesLoading} />
        </TabsContent>

        <TabsContent value="buku-kas" className="mt-4">
          <BukuKasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Transaction Tab ──────────────────────────────────────────────────────────

function TransactionTab() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [createOpen, setCreateOpen] = useState(false)

  const { data: categories = [] } = useCategories()
  const { data: txData, isLoading } = useTransactions({
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(typeFilter && typeFilter !== "all" ? { transaction_type: typeFilter } : {}),
  })
  const transactions = txData?.transactions ?? []

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: "approved" | "rejected"
    }) => api.patch(`/financial/transactions/${id}/review`, { status }),
    onSuccess: () => {
      toast.success("Transaksi berhasil diproses")
      qc.invalidateQueries({ queryKey: ["financial-transactions"] })
      qc.invalidateQueries({ queryKey: ["financial-balances"] })
    },
    onError: () => toast.error("Gagal memproses transaksi"),
  })

  const filtered = transactions.filter(
    (t) =>
      !search ||
      t.category_name.toLowerCase().includes(search.toLowerCase()) ||
      t.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const columns: ColumnDef<FinancialTransaction>[] = [
    {
      accessorKey: "created_at",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{formatDateTime(row.original.created_at)}</span>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Kategori",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.original.category_name}
        </span>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Jenis",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.original.entry_side === "credit"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {row.original.transaction_type === "income_report"
            ? "Uang Masuk"
            : "Uang Keluar"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Jumlah",
      cell: ({ row }) => (
        <span
          className={`text-sm font-semibold ${row.original.entry_side === "credit"
              ? "text-emerald-700"
              : "text-red-600"
            }`}
        >
          {row.original.entry_side === "credit" ? "+" : "-"}
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "requester_name",
      header: "Disubmit Oleh",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.requester_name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Catatan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 max-w-[200px] truncate block">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (row.original.status !== "pending") return null
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700"
              onClick={() =>
                reviewMutation.mutate({
                  id: row.original.id,
                  status: "rejected",
                })
              }
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Tolak
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
              onClick={() =>
                reviewMutation.mutate({
                  id: row.original.id,
                  status: "approved",
                })
              }
              disabled={reviewMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Setujui
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <DataTableToolbar
              globalFilter={search}
              onGlobalFilterChange={setSearch}
              placeholder="Cari transaksi..."
            />
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="income_report">Uang Masuk</SelectItem>
                  <SelectItem value="request_fund">Uang Keluar</SelectItem>
                </SelectContent>
              </Select>
              {can("create", "finance") && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-9 text-sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Buat Transaksi
                </Button>
              )}
            </div>
          </div>
          <DataTable columns={columns} data={filtered} loading={isLoading} />
        </CardContent>
      </Card>

      <CreateTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
      />
    </>
  )
}

// ─── Create Transaction Dialog ────────────────────────────────────────────────

function CreateTransactionDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: FinancialCategory[]
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    category_id: "",
    transaction_type: "" as string,
    amount: "",
    description: "",
  })

  const createMutation = useMutation({
    mutationFn: (data: {
      category_id: string
      transaction_type: string
      amount: number
      description?: string
    }) => api.post("/financial/transactions", data),
    onSuccess: () => {
      toast.success("Transaksi berhasil dibuat")
      qc.invalidateQueries({ queryKey: ["financial-transactions"] })
      qc.invalidateQueries({ queryKey: ["financial-balances"] })
      onOpenChange(false)
      setForm({ category_id: "", transaction_type: "", amount: "", description: "" })
    },
    onError: () => toast.error("Gagal membuat transaksi"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Transaksi Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Kategori <span className="text-red-500">*</span></Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis Transaksi <span className="text-red-500">*</span></Label>
            <Select
              value={form.transaction_type}
              onValueChange={(v) => setForm((f) => ({ ...f, transaction_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income_report">Lapor Pemasukan (Uang Masuk)</SelectItem>
                <SelectItem value="request_fund">Request Dana (Uang Keluar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Jumlah (Rp) <span className="text-red-500">*</span></Label>
            <Input
              id="tx-amount"
              type="number"
              min="0"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-desc">Catatan</Label>
            <Textarea
              id="tx-desc"
              placeholder="Deskripsi transaksi..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={
              !form.category_id ||
              !form.transaction_type ||
              !form.amount ||
              parseFloat(form.amount) <= 0 ||
              createMutation.isPending
            }
            onClick={() =>
              createMutation.mutate({
                category_id: form.category_id,
                transaction_type: form.transaction_type,
                amount: parseFloat(form.amount),
                description: form.description.trim() || undefined,
              })
            }
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Category Tab ─────────────────────────────────────────────────────────────

function CategoryTab() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  const { data: categories = [], isLoading } = useCategories()

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post("/financial/categories", { name }),
    onSuccess: () => {
      toast.success("Kategori berhasil ditambahkan")
      qc.invalidateQueries({ queryKey: ["financial-categories"] })
      setCreateOpen(false)
      setNewCatName("")
    },
    onError: () => toast.error("Gagal menambahkan kategori"),
  })

  const columns: ColumnDef<FinancialCategory>[] = [
    {
      accessorKey: "name",
      header: "Nama Kategori",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_active ? "approved" : "rejected"} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDateTime(row.original.created_at)}</span>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Kategori digunakan untuk mengelompokkan transaksi keuangan. Hanya bisa
              ditambah dari web.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </Button>
          </div>
          <DataTable columns={columns} data={categories} loading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nama Kategori <span className="text-red-500">*</span></Label>
              <Input
                id="cat-name"
                placeholder="Contoh: Operasional, Kesehatan, dll"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!newCatName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(newCatName.trim())}
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Report per Category Tab ──────────────────────────────────────────────────

function ReportTab({
  balances,
  balancesLoading,
}: {
  balances: FinancialBalances | undefined
  balancesLoading: boolean
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const byCategory = balances?.by_category ?? []

  const { data: txData, isLoading: txLoading } = useTransactions(
    selectedCategoryId
      ? { category_id: selectedCategoryId, status: "approved" }
      : { status: "approved" }
  )
  const transactions = txData?.transactions ?? []

  const selectedCategory = byCategory.find((c) => c.category_id === selectedCategoryId)

  const columns: ColumnDef<FinancialTransaction>[] = [
    {
      accessorKey: "created_at",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{formatDateTime(row.original.created_at)}</span>
      ),
    },
    {
      accessorKey: "requester_name",
      header: "Oleh",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-700">{row.original.requester_name}</span>
      ),
    },
    {
      id: "uang_masuk",
      header: "Uang Masuk",
      cell: ({ row }) =>
        row.original.entry_side === "credit" ? (
          <span className="text-sm font-semibold text-emerald-700">
            {formatCurrency(row.original.amount)}
          </span>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        ),
    },
    {
      id: "uang_keluar",
      header: "Uang Keluar",
      cell: ({ row }) =>
        row.original.entry_side === "debit" ? (
          <span className="text-sm font-semibold text-red-600">
            {formatCurrency(row.original.amount)}
          </span>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        ),
    },
    {
      id: "saldo",
      header: "Saldo",
      cell: ({ row, table }) => {
        // Calculate running balance for the current view
        // Note: This is an approximation based on the loaded data (limit 100)
        const allData = table.getFilteredRowModel().rows
        const currentIndex = row.index

        // We calculate balance from bottom to top of the current display
        // or just show the snapshot if possible. 
        // For simplicity and accuracy in categorical view:
        let runningBalance = selectedCategory ? selectedCategory.balance : (balances?.current_balance ?? 0)

        for (let i = 0; i < currentIndex; i++) {
          const tx = allData[i].original
          if (tx.entry_side === 'credit') runningBalance -= tx.amount
          else runningBalance += tx.amount
        }

        return (
          <span className="text-sm font-mono font-medium text-gray-900">
            {formatCurrency(runningBalance)}
          </span>
        )
      },
    },
    {
      accessorKey: "category_name",
      header: "Kategori",
      cell: ({ row }) => (
        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
          {row.original.category_name}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Catatan",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 max-w-[150px] truncate block" title={row.original.description ?? ""}>
          {row.original.description ?? "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Category balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balancesLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          byCategory.map((cat) => (
            <Card
              key={cat.category_id}
              className={`cursor-pointer transition-all ${selectedCategoryId === cat.category_id
                  ? "ring-2 ring-emerald-500 bg-emerald-50/30 border-emerald-500 shadow-md"
                  : "hover:border-emerald-300 hover:shadow-sm"
                }`}
              onClick={() =>
                setSelectedCategoryId(
                  selectedCategoryId === cat.category_id ? "" : cat.category_id
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-gray-900 truncate mr-2" title={cat.category_name}>
                    {cat.category_name}
                  </p>
                  {selectedCategoryId === cat.category_id && (
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <div className="flex flex-col mt-2 space-y-0.5">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                    <span>Masuk</span>
                    <span>Keluar</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-emerald-600">{formatCurrency(cat.total_credit)}</span>
                    <span className="text-red-600">{formatCurrency(cat.total_debit)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p
                    className={`text-sm font-bold ${cat.balance >= 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                  >
                    Saldo: {formatCurrency(cat.balance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transaction table for selected category */}
      <Card className="border-emerald-100">
        <CardHeader className="py-4 bg-emerald-50/50 border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-emerald-900">
              {selectedCategory
                ? `Laporan Mutasi — ${selectedCategory.category_name}`
                : "Laporan Mutasi — Semua Kategori"}
            </CardTitle>
            {selectedCategoryId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-emerald-600 h-8"
                onClick={() => setSelectedCategoryId("")}
              >
                Reset Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={transactions} loading={txLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Buku Kas (Accounting Ledger) Tab ─────────────────────────────────────────

type PeriodType = "triwulan" | "semester" | "tahunan"

const PERIOD_OPTIONS: { type: PeriodType; label: string; sub: { value: string; label: string }[] }[] = [
  {
    type: "triwulan",
    label: "Triwulan",
    sub: [
      { value: "Q1", label: "Q1 (Jan – Mar)" },
      { value: "Q2", label: "Q2 (Apr – Jun)" },
      { value: "Q3", label: "Q3 (Jul – Sep)" },
      { value: "Q4", label: "Q4 (Okt – Des)" },
    ],
  },
  {
    type: "semester",
    label: "Semester",
    sub: [
      { value: "H1", label: "Semester 1 (Jan – Jun)" },
      { value: "H2", label: "Semester 2 (Jul – Des)" },
    ],
  },
  {
    type: "tahunan",
    label: "Tahunan",
    sub: [{ value: "FY", label: "Setahun Penuh" }],
  },
]

function getDateRange(year: number, periodType: PeriodType, periodValue: string) {
  const ranges: Record<string, [string, string]> = {
    Q1: [`${year}-01-01`, `${year}-03-31`],
    Q2: [`${year}-04-01`, `${year}-06-30`],
    Q3: [`${year}-07-01`, `${year}-09-30`],
    Q4: [`${year}-10-01`, `${year}-12-31`],
    H1: [`${year}-01-01`, `${year}-06-30`],
    H2: [`${year}-07-01`, `${year}-12-31`],
    FY: [`${year}-01-01`, `${year}-12-31`],
  }
  return ranges[periodValue] ?? [`${year}-01-01`, `${year}-12-31`]
}

function getPeriodLabel(periodType: PeriodType, periodValue: string, year: number) {
  const opt = PERIOD_OPTIONS.find((p) => p.type === periodType)
  const sub = opt?.sub.find((s) => s.value === periodValue)
  return `${sub?.label ?? periodValue} ${year}`
}

function BukuKasTab() {
  const currentYear = new Date().getFullYear()
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`

  const [year, setYear] = useState(currentYear)
  const [periodType, setPeriodType] = useState<PeriodType>("triwulan")
  const [periodValue, setPeriodValue] = useState(currentQuarter)

  const [dateFrom, dateTo] = getDateRange(year, periodType, periodValue)

  const { data: txData, isLoading } = useTransactions({
    status: "approved",
    date_from: dateFrom,
    date_to: dateTo,
    limit: 500,
  })

  // Sort oldest-first for accounting ledger (API returns newest-first)
  const transactions = useMemo(() => {
    const items = txData?.transactions ?? []
    return [...items].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [txData])

  // Calculate running balance & totals
  const { rows, totalDebit, totalCredit } = useMemo(() => {
    let runningBalance = 0
    let totalDebit = 0
    let totalCredit = 0
    const rows = transactions.map((tx, idx) => {
      const debit = tx.entry_side === "debit" ? tx.amount : 0
      const credit = tx.entry_side === "credit" ? tx.amount : 0
      totalDebit += debit
      totalCredit += credit
      runningBalance += credit - debit
      return { ...tx, no: idx + 1, debit, credit, runningBalance }
    })
    return { rows, totalDebit, totalCredit }
  }, [transactions])

  const periodLabel = getPeriodLabel(periodType, periodValue, year)
  const subOptions = PERIOD_OPTIONS.find((p) => p.type === periodType)?.sub ?? []

  // Years for picker (last 5 years + next year)
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

  function handleExportCSV() {
    if (rows.length === 0) {
      toast.error("Tidak ada data untuk diexport")
      return
    }

    const header = ["No", "Tanggal", "Keterangan", "Kategori", "Debit", "Kredit", "Saldo", "Disubmit Oleh"]
    const csvRows = rows.map((r) => [
      r.no,
      formatDate(r.created_at),
      r.description ?? "-",
      r.category_name,
      r.debit || "",
      r.credit || "",
      r.runningBalance,
      r.requester_name,
    ])
    // Add totals row
    csvRows.push(["", "", "TOTAL", "", totalDebit, totalCredit, totalCredit - totalDebit, ""])

    const csvContent = [header, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Laporan-Keuangan-${periodValue}-${year}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Laporan berhasil diexport")
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Tahun</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Jenis Periode</Label>
              <Select
                value={periodType}
                onValueChange={(v) => {
                  const pt = v as PeriodType
                  setPeriodType(pt)
                  const firstSub = PERIOD_OPTIONS.find((p) => p.type === pt)?.sub[0]
                  if (firstSub) setPeriodValue(firstSub.value)
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.type} value={p.type}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Periode</Label>
              <Select value={periodValue} onValueChange={setPeriodValue}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              className="gap-2 h-9 text-sm"
              onClick={handleExportCSV}
              disabled={rows.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounting ledger table */}
      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold">
                  Buku Kas — {periodLabel}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(dateFrom)} — {formatDate(dateTo)}
                </p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {rows.length} transaksi
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Tidak ada transaksi pada periode ini</p>
              <p className="text-xs mt-1">Pilih periode lain atau buat transaksi terlebih dahulu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase w-12">No</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Keterangan</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Debit</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Kredit</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Saldo</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-center text-gray-500 font-mono text-xs">{row.no}</td>
                      <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{formatDate(row.created_at)}</td>
                      <td className="py-2.5 px-3 text-gray-700 max-w-[220px] truncate" title={row.description ?? ""}>
                        {row.description || (row.transaction_type === "income_report" ? "Lapor Pemasukan" : "Request Dana")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
                          {row.category_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {row.debit > 0 ? (
                          <span className="text-red-600 font-medium">{formatCurrency(row.debit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {row.credit > 0 ? (
                          <span className="text-emerald-700 font-medium">{formatCurrency(row.credit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={`font-semibold ${row.runningBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                          {formatCurrency(row.runningBalance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 text-xs">{row.requester_name}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300">
                    <td colSpan={4} className="py-3 px-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Total
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-700">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(totalCredit - totalDebit)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

