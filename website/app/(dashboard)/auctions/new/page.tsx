"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import api from "@/lib/api"

const auctionSchema = z
  .object({
    title: z.string().min(3, "Judul minimal 3 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter"),
    starting_price: z.number().positive("Harga awal harus lebih dari 0"),
    min_increment: z.number().positive("Kelipatan bid harus lebih dari 0"),
    start_time: z.string().min(1, "Waktu mulai wajib diisi"),
    end_time: z.string().min(1, "Waktu selesai wajib diisi"),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["end_time"],
  })

type AuctionFormValues = z.infer<typeof auctionSchema>

interface CreateAuctionPayload {
  title: string
  description: string
  starting_price: number
  min_increment: number
  start_time: string
  end_time: string
}

export default function NewAuctionPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      min_increment: 5000,
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateAuctionPayload) =>
      api.post("/auctions", payload),
    onSuccess: () => {
      toast.success("Lelang berhasil dibuat")
      router.push("/auctions")
    },
    onError: () => toast.error("Gagal membuat lelang"),
  })

  function onSubmit(values: AuctionFormValues) {
    createMutation.mutate({
      title: values.title,
      description: values.description,
      starting_price: values.starting_price,
      min_increment: values.min_increment,
      start_time: new Date(values.start_time).toISOString(),
      end_time: new Date(values.end_time).toISOString(),
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Lelang Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Isi detail lelang yang akan diterbitkan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Lelang</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Lelang <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Jam Tangan Antik Emas"
                {...register("title")}
                className={errors.title ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Deskripsi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsikan kondisi, ukuran, dan detail item lelang..."
                rows={4}
                {...register("description")}
                className={errors.description ? "border-red-400 focus-visible:ring-red-400" : ""}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <Separator />

            {/* Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_price">
                  Harga Awal (IDR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="starting_price"
                  type="number"
                  placeholder="50000"
                  min={1}
                  {...register("starting_price", { valueAsNumber: true })}
                  className={
                    errors.starting_price ? "border-red-400 focus-visible:ring-red-400" : ""
                  }
                />
                {errors.starting_price && (
                  <p className="text-xs text-red-500">{errors.starting_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_increment">
                  Kelipatan Bid (IDR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="min_increment"
                  type="number"
                  placeholder="5000"
                  min={1}
                  {...register("min_increment", { valueAsNumber: true })}
                  className={
                    errors.min_increment ? "border-red-400 focus-visible:ring-red-400" : ""
                  }
                />
                {errors.min_increment && (
                  <p className="text-xs text-red-500">{errors.min_increment.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Waktu Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register("start_time")}
                  className={errors.start_time ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {errors.start_time && (
                  <p className="text-xs text-red-500">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">
                  Waktu Selesai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register("end_time")}
                  className={errors.end_time ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                {errors.end_time && (
                  <p className="text-xs text-red-500">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-32"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {createMutation.isPending ? "Menyimpan..." : "Buat Lelang"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
