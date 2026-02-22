"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { NewsArticle, Program } from "@/types"

function useNewsArticles() {
  return useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const response = await api.get<NewsArticle[]>("/content/news", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response.data) ? response.data : []
    },
  })
}

function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const response = await api.get<Program[]>("/content/programs", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response.data) ? response.data : []
    },
  })
}

export default function ContentPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const statusParam = searchParams.get("status")
  const initialTab = tabParam === "program" ? "program" : "berita"
  const [searchNews, setSearchNews] = useState("")
  const [searchPrograms, setSearchPrograms] = useState("")
  const [activeTab, setActiveTab] = useState<"berita" | "program">(initialTab)
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; title?: string } | null>(null)

  const { data: articles = [], isLoading: articlesLoading, isError: articlesError } = useNewsArticles()
  const { data: programs = [], isLoading: programsLoading, isError: programsError } = usePrograms()

  const approveNewsMutation = useMutation({
    mutationFn: (id: string) => api.post(`/content/news/${id}/approve`),
    onSuccess: () => {
      toast.success("Artikel disetujui")
      qc.invalidateQueries({ queryKey: ["news-articles"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menyetujui artikel"),
  })

  const publishNewsMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/content/news/${id}/publish`, { is_published: !isPublished }),
    onSuccess: () => {
      toast.success("Status publikasi diperbarui")
      qc.invalidateQueries({ queryKey: ["news-articles"] })
    },
    onError: () => toast.error("Gagal mengubah status publikasi"),
  })

  const deleteNewsMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/news/${id}`),
    onSuccess: () => {
      toast.success("Artikel dihapus")
      qc.invalidateQueries({ queryKey: ["news-articles"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menghapus artikel"),
  })

  const publishProgramMutation = useMutation({
    mutationFn: (id: string) => api.post(`/content/programs/${id}/publish`),
    onSuccess: () => {
      toast.success("Status program diperbarui")
      qc.invalidateQueries({ queryKey: ["programs"] })
    },
    onError: () => toast.error("Gagal mengubah status program"),
  })

  const deleteProgramMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/programs/${id}`),
    onSuccess: () => {
      toast.success("Program dihapus")
      qc.invalidateQueries({ queryKey: ["programs"] })
      setConfirmAction(null)
    },
    onError: () => toast.error("Gagal menghapus program"),
  })

  const filteredArticles = articles.filter(
    (a) =>
      (!statusParam || a.status === statusParam) &&
      (
        !searchNews ||
        a.title.toLowerCase().includes(searchNews.toLowerCase()) ||
        a.category.toLowerCase().includes(searchNews.toLowerCase())
      )
  )

  const filteredPrograms = programs.filter(
    (p) =>
      (!statusParam || p.status === statusParam) &&
      (
        !searchPrograms ||
        p.title.toLowerCase().includes(searchPrograms.toLowerCase())
      )
  )

  const newsColumns: ColumnDef<NewsArticle>[] = [
    {
      id: "thumbnail",
      header: "Thumbnail",
      cell: ({ row }) =>
        row.original.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.thumbnail_url}
            alt={row.original.title}
            className="h-10 w-16 object-cover rounded border border-gray-200"
          />
        ) : (
          <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
            —
          </div>
        ),
    },
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => (
        <Link
          href={`/content/news/${row.original.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 line-clamp-2 max-w-[280px]"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <StatusBadge status={row.original.category} />
      ),
    },
    {
      accessorKey: "tags",
      header: "Tag",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500 line-clamp-1 max-w-[120px]">
          {row.original.tags ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_by",
      header: "Penulis",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.created_by}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const a = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/content/news/${a.id}`}>Lihat / Edit</Link>
              </DropdownMenuItem>
              {a.status === "pending_review" && can("approve", "content") && (
                <DropdownMenuItem
                  className="text-emerald-600"
                  onClick={() => setConfirmAction({ type: "approve_news", id: a.id, title: a.title })}
                >
                  Setujui
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => publishNewsMutation.mutate({ id: a.id, isPublished: a.is_published })}
              >
                {a.is_published ? "Sembunyikan" : "Publikasikan"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setConfirmAction({ type: "delete_news", id: a.id, title: a.title })}
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const programColumns: ColumnDef<Program>[] = [
    {
      id: "thumbnail",
      header: "Thumbnail",
      cell: ({ row }) =>
        row.original.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.thumbnail_url}
            alt={row.original.title}
            className="h-10 w-16 object-cover rounded border border-gray-200"
          />
        ) : (
          <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
            —
          </div>
        ),
    },
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => (
        <Link
          href={`/content/programs/${row.original.id}`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 line-clamp-2 max-w-[240px]"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "target_amount",
      header: "Target",
      cell: ({ row }) =>
        row.original.target_amount != null
          ? formatCurrency(row.original.target_amount)
          : "—",
    },
    {
      accessorKey: "collected_amount",
      header: "Terkumpul",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-emerald-700">
          {formatCurrency(row.original.collected_amount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "is_featured",
      header: "Unggulan",
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.is_featured ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
          {row.original.is_featured ? "Ya" : "Tidak"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const p = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/content/programs/${p.id}`}>Lihat / Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => publishProgramMutation.mutate(p.id)}>
                Publikasikan / Toggle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setConfirmAction({ type: "delete_program", id: p.id, title: p.title })}
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Konten</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola berita dan program organisasi</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "berita" | "program")}>
        <TabsList>
          <TabsTrigger value="berita">Berita</TabsTrigger>
          <TabsTrigger value="program">Program</TabsTrigger>
        </TabsList>

        <TabsContent value="berita" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {articlesError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Gagal memuat data berita. Silakan refresh halaman.
                </div>
              )}
              <DataTableToolbar
                globalFilter={searchNews}
                onGlobalFilterChange={setSearchNews}
                placeholder="Cari judul atau kategori..."
                actions={
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Link href="/content/news/new">
                      <Plus className="h-4 w-4" />
                      Tulis Artikel
                    </Link>
                  </Button>
                }
              />
              <DataTable columns={newsColumns} data={filteredArticles} loading={articlesLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {programsError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Gagal memuat data program. Silakan refresh halaman.
                </div>
              )}
              <DataTableToolbar
                globalFilter={searchPrograms}
                onGlobalFilterChange={setSearchPrograms}
                placeholder="Cari judul program..."
                actions={
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Link href="/content/programs/new">
                      <Plus className="h-4 w-4" />
                      Tambah Program
                    </Link>
                  </Button>
                }
              />
              <DataTable columns={programColumns} data={filteredPrograms} loading={programsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm: Approve news */}
      <ConfirmDialog
        open={confirmAction?.type === "approve_news"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Setujui Artikel"
        description={`Setujui artikel "${confirmAction?.title}"?`}
        confirmLabel="Setujui"
        loading={approveNewsMutation.isPending}
        onConfirm={() => approveNewsMutation.mutate(confirmAction!.id)}
      />

      {/* Confirm: Delete news */}
      <ConfirmDialog
        open={confirmAction?.type === "delete_news"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Hapus Artikel"
        description={`Hapus artikel "${confirmAction?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteNewsMutation.isPending}
        onConfirm={() => deleteNewsMutation.mutate(confirmAction!.id)}
      />

      {/* Confirm: Delete program */}
      <ConfirmDialog
        open={confirmAction?.type === "delete_program"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Hapus Program"
        description={`Hapus program "${confirmAction?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteProgramMutation.isPending}
        onConfirm={() => deleteProgramMutation.mutate(confirmAction!.id)}
      />
    </div>
  )
}
