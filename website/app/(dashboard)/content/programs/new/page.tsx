"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import api from "@/lib/api"
import type { Program } from "@/types"

const schema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  target_amount: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewProgramPage() {
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      target_amount: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post<Program>("/content/programs", {
        title: data.title,
        description: data.description,
        target_amount: data.target_amount ? parseFloat(data.target_amount) : undefined,
      }),
    onSuccess: () => {
      toast.success("Program berhasil dibuat")
      router.push("/content")
    },
    onError: () => toast.error("Gagal membuat program"),
  })

  function onSubmit(values: FormValues) {
    createMutation.mutate(values)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/content">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Program</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buat program donasi atau kegiatan baru</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormLabel>
                      Judul Program <span className="text-red-500">*</span>
                    </FormLabel>
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
                    <FormLabel>
                      Deskripsi <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi lengkap program..."
                        rows={6}
                        {...field}
                      />
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
                        placeholder="Kosongkan jika tidak ada target dana"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/content">Batal</Link>
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Menyimpan..." : "Buat Program"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
