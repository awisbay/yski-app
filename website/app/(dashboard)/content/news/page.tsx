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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/DataTable"
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { NewsArticle } from "@/types"

function useNewsArticles() {
  return useQuery({
    queryKey: ["news-articles"],
    queryFn: async () => {
      const response = await api.get<NewsArticle[]>("/content/news", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response) ? response : []
    },
  })
}

export default function NewsPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const [search, setSearch] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; title?: string } | null>(null)

  const { data: articles = [], isLoading, isError } = useNewsArticles()

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

  const filteredArticles = articles.filter(
    (a) =>
      (!statusParam || a.status === statusParam) &&
      (
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
      )
  )

  const columns: ColumnDef<NewsArticle>[] = [
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
      cell: ({ row }) => <StatusBadge status={row.original.category} />,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola artikel berita organisasi</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Gagal memuat data berita. Silakan refresh halaman.
            </div>
          )}
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
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
          <DataTable columns={columns} data={filteredArticles} loading={isLoading} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction?.type === "approve_news"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Setujui Artikel"
        description={`Setujui artikel "${confirmAction?.title}"?`}
        confirmLabel="Setujui"
        loading={approveNewsMutation.isPending}
        onConfirm={() => approveNewsMutation.mutate(confirmAction!.id)}
      />

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
    </div>
  )
}
