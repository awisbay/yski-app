import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined, fmt = "dd MMM yyyy"): string {
  if (!dateStr) return "—"
  try {
    return format(new Date(dateStr), fmt, { locale: idLocale })
  } catch {
    return "—"
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, "dd MMM yyyy, HH:mm")
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale })
  } catch {
    return "—"
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n)
}

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000"
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

