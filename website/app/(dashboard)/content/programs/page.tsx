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
import { formatCurrency } from "@/lib/utils"
import type { Program } from "@/types"

function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const response = await api.get<Program[]>("/content/programs", { params: { skip: 0, limit: 100 } })
      return Array.isArray(response) ? response : []
    },
  })
}

export default function ProgramsPage() {
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const [search, setSearch] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; title?: string } | null>(null)

  const { data: programs = [], isLoading, isError } = usePrograms()

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

  const filteredPrograms = programs.filter(
    (p) =>
      (!statusParam || p.status === statusParam) &&
      (!search || p.title.toLowerCase().includes(search.toLowerCase()))
  )

  const columns: ColumnDef<Program>[] = [
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Program</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola program donasi dan kegiatan organisasi</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Gagal memuat data program. Silakan refresh halaman.
            </div>
          )}
          <DataTableToolbar
            globalFilter={search}
            onGlobalFilterChange={setSearch}
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
          <DataTable columns={columns} data={filteredPrograms} loading={isLoading} />
        </CardContent>
      </Card>

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
