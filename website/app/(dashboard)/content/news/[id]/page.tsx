"use client"

import { use, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import type { NewsArticle } from "@/types"

const CATEGORIES = [
  { value: "general", label: "Umum" },
  { value: "kesehatan", label: "Kesehatan" },
  { value: "bencana", label: "Bencana" },
  { value: "pendidikan", label: "Pendidikan" },
  { value: "lain_lain", label: "Lain-lain" },
]

const schema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  excerpt: z.string().optional(),
  content: z.string().min(20, "Konten minimal 20 karakter"),
  category: z.string().min(1, "Pilih kategori"),
  tags: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  scheduled_at: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { can } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)

  const { data: article, isLoading } = useQuery({
    queryKey: ["news-article", id],
    queryFn: () => api.get<NewsArticle>(`/content/news/${id}`).then((r) => r.data),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      meta_title: "",
      meta_description: "",
      scheduled_at: "",
    },
  })

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        excerpt: article.excerpt ?? "",
        content: article.content,
        category: article.category,
        tags: article.tags ?? "",
        meta_title: article.meta_title ?? "",
        meta_description: article.meta_description ?? "",
        scheduled_at: article.scheduled_at
          ? new Date(article.scheduled_at).toISOString().slice(0, 16)
          : "",
      })
    }
  }, [article, form])

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.put(`/content/news/${id}`, {
        ...data,
        scheduled_at: data.scheduled_at || undefined,
      }),
    onSuccess: () => {
      toast.success("Artikel berhasil disimpan")
      qc.invalidateQueries({ queryKey: ["news-article", id] })
      qc.invalidateQueries({ queryKey: ["news-articles"] })
    },
    onError: () => toast.error("Gagal menyimpan artikel"),
  })

  const submitReviewMutation = useMutation({
    mutationFn: () => api.post(`/content/news/${id}/submit`),
    onSuccess: () => {
      toast.success("Artikel dikirim untuk review")
      qc.invalidateQueries({ queryKey: ["news-article", id] })
    },
    onError: () => toast.error("Gagal mengirim untuk review"),
  })

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/content/news/${id}/approve`),
    onSuccess: () => {
      toast.success("Artikel disetujui")
      qc.invalidateQueries({ queryKey: ["news-article", id] })
      qc.invalidateQueries({ queryKey: ["news-articles"] })
    },
    onError: () => toast.error("Gagal menyetujui artikel"),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/content/news/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Artikel ditolak")
      qc.invalidateQueries({ queryKey: ["news-article", id] })
      qc.invalidateQueries({ queryKey: ["news-articles"] })
      setShowRejectInput(false)
      setRejectReason("")
    },
    onError: () => toast.error("Gagal menolak artikel"),
  })

  const publishMutation = useMutation({
    mutationFn: () =>
      api.patch(`/content/news/${id}/publish`, { is_published: !article?.is_published }),
    onSuccess: () => {
      toast.success(article?.is_published ? "Artikel disembunyikan" : "Artikel dipublikasikan")
      qc.invalidateQueries({ queryKey: ["news-article", id] })
      qc.invalidateQueries({ queryKey: ["news-articles"] })
    },
    onError: () => toast.error("Gagal mengubah status publikasi"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/content/news/${id}`),
    onSuccess: () => {
      toast.success("Artikel dihapus")
      router.push("/content")
    },
    onError: () => toast.error("Gagal menghapus artikel"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Artikel tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/content">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Artikel</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={article.status} />
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konten Artikel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Judul artikel..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ringkasan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ringkasan singkat artikel..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konten <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Isi konten artikel..."
                        rows={14}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="tag1, tag2, tag3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO & Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Meta title untuk SEO..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Meta description untuk SEO..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jadwal Publikasi</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Publishing panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Publikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-gray-500">Status saat ini:</Label>
            <StatusBadge status={article.status} />
          </div>

          {article.rejection_reason && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <Label className="text-xs text-red-600 font-semibold">Alasan Penolakan:</Label>
              <p className="text-sm text-red-700 mt-1">{article.rejection_reason}</p>
            </div>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {(article.status === "draft" || article.status === "rejected") && (
              <Button
                variant="outline"
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                Kirim untuk Review
              </Button>
            )}

            {article.status === "pending_review" && can("approve", "content") && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  Setujui Artikel
                </Button>
                {!showRejectInput ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectInput(true)}
                  >
                    Tolak Artikel
                  </Button>
                ) : (
                  <div className="w-full space-y-2">
                    <Textarea
                      placeholder="Alasan penolakan..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate(rejectReason)}
                        disabled={!rejectReason.trim() || rejectMutation.isPending}
                      >
                        Konfirmasi Penolakan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowRejectInput(false)
                          setRejectReason("")
                        }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {(article.status === "approved" || article.status === "published") && (
              <Button
                variant={article.is_published ? "outline" : "default"}
                className={!article.is_published ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {article.is_published ? "Sembunyikan" : "Publikasikan"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus Artikel"
        description={`Hapus artikel "${article.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
