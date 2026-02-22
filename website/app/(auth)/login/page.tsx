"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import type { LoginResponse, User } from "@/types"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (isAuthenticated) router.replace("/")
    if (searchParams.get("error") === "access_denied") setAccessDenied(true)
  }, [isAuthenticated, router, searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setAccessDenied(false)
    try {
      const tokenData = await api.post<LoginResponse>("/auth/login", {
        email: values.email,
        password: values.password,
      })

      // Decode role from JWT
      const payload = JSON.parse(atob(tokenData.access_token.split(".")[1]))
      if (!["admin", "pengurus"].includes(payload.role)) {
        setAccessDenied(true)
        return
      }

      // Fetch full user profile
      const user = await api.get<User>("/users/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })

      setAuth(user, tokenData.access_token, tokenData.refresh_token)
      toast.success(`Assalamu'alaikum, ${user.full_name}!`)
      router.replace("/")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Login gagal. Periksa email dan password Anda."
      toast.error(msg)
    }
  }

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-5 px-6 pt-8 sm:px-10 sm:pt-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5">
            <Image
              src="/yski-logo.png"
              alt="YSKI Logo"
              width={44}
              height={44}
              priority
              className="h-11 w-11 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">YSKI Dashboard</CardTitle>
            <CardDescription>Masuk sebagai Admin atau Pengurus</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-10 sm:pb-10">
        {accessDenied && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Akses ditolak. Hanya Admin dan Pengurus yang dapat masuk ke dashboard.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="admin@yski.org"
                className="h-11 rounded-xl border-gray-200 pl-9 focus-visible:ring-emerald-500"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-xl border-gray-200 pl-9 focus-visible:ring-emerald-500"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4fbf8] p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-teal-200/60 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/95 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.35)] backdrop-blur md:grid-cols-2">
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-10 text-white md:flex">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide">
                <ShieldCheck className="h-4 w-4" />
                Dashboard Internal
              </div>
              <h1 className="text-3xl font-bold leading-tight">
                Assalamu&apos;alaikum
              </h1>
              <p className="mt-3 max-w-sm text-sm text-emerald-50/90">
                Kelola operasional YSKI dengan akses Admin dan Pengurus dari satu dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs text-emerald-50/90">
                Pastikan akun Anda memiliki role resmi untuk mengakses modul manajemen.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
