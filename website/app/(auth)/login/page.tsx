"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Lock, Mail } from "lucide-react"

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

export default function LoginPage() {
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
      const { data: tokenData } = await api.post<LoginResponse>("/auth/login", {
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
      const { data: user } = await api.get<User>("/users/me", {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">YSKI Dashboard</CardTitle>
          <CardDescription>Masuk sebagai Admin atau Pengurus</CardDescription>
        </CardHeader>
        <CardContent>
          {accessDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Akses ditolak. Hanya Admin dan Pengurus yang dapat masuk ke dashboard.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yski.org"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
