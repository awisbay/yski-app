"use client"

import { use, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
import api from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { Program } from "@/types"

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
]

const schema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  target_amount: z.string().optional(),
  status: z.string().min(1, "Pilih status"),
  is_featured: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data: program, isLoading } = useQuery({
    queryKey: ["program", id],
    queryFn: () => api.get<Program>(`/content/programs/${id}`).then((r) => r.data),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      target_amount: "",
      status: "active",
      is_featured: false,
    },
  })

  useEffect(() => {
    if (program) {
      form.reset({
        title: program.title,
        description: program.description,
        target_amount: program.target_amount != null ? String(program.target_amount) : "",
        status: program.status,
        is_featured: program.is_featured,
      })
    }
  }, [program, form])

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.put(`/content/programs/${id}`, {
        title: data.title,
        description: data.description,
        target_amount: data.target_amount ? parseFloat(data.target_amount) : undefined,
        status: data.status,
        is_featured: data.is_featured,
      }),
    onSuccess: () => {
      toast.success("Program berhasil disimpan")
      qc.invalidateQueries({ queryKey: ["program", id] })
      qc.invalidateQueries({ queryKey: ["programs"] })
    },
    onError: () => toast.error("Gagal menyimpan program"),
  })

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/content/programs/${id}/publish`),
    onSuccess: () => {
      toast.success("Status program diperbarui")
      qc.invalidateQueries({ queryKey: ["program", id] })
      qc.invalidateQueries({ queryKey: ["programs"] })
    },
    onError: () => toast.error("Gagal mengubah status publikasi"),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Program tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Program</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={program.status} />
            {program.is_featured && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Unggulan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress info */}
      {program.target_amount != null && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(program.collected_amount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Terkumpul</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(program.target_amount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Target</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">
                  {Math.min(100, Math.round((program.collected_amount / program.target_amount) * 100))}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Progress</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (program.collected_amount / program.target_amount) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nama program..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Deskripsi program..." rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Dana (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Kosongkan jika tidak ada target"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
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
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Unggulan</FormLabel>
                      <div className="flex items-center gap-3 mt-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <Label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer">
                          Tampilkan sebagai unggulan
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

      {/* Publish panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publikasi Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-gray-500">Status:</Label>
            <StatusBadge status={program.status} />
          </div>
          <Separator />
          <Button
            variant="outline"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? "Memproses..." : "Toggle Publikasi"}
          </Button>
          <p className="text-xs text-gray-400">
            Klik untuk mengubah status publikasi program di aplikasi publik.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
