import { cn } from "@/lib/utils"

type Status = string

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Generic
  pending: { label: "Menunggu", className: "bg-yellow-100 text-yellow-800" },
  pending_review: { label: "Menunggu Review", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Disetujui", className: "bg-green-100 text-green-800" },
  active: { label: "Aktif", className: "bg-green-100 text-green-800" },
  published: { label: "Dipublikasikan", className: "bg-green-100 text-green-800" },
  paid: { label: "Lunas", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Selesai", className: "bg-blue-100 text-blue-800" },
  sold: { label: "Terjual", className: "bg-blue-100 text-blue-800" },
  returned: { label: "Dikembalikan", className: "bg-blue-100 text-blue-800" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Dibatalkan", className: "bg-red-100 text-red-800" },
  refunded: { label: "Direfund", className: "bg-red-100 text-red-800" },
  in_progress: { label: "Dalam Proses", className: "bg-orange-100 text-orange-800" },
  borrowed: { label: "Dipinjam", className: "bg-orange-100 text-orange-800" },
  bidding: { label: "Lelang Aktif", className: "bg-orange-100 text-orange-800" },
  accepted: { label: "Diterima", className: "bg-emerald-100 text-emerald-800" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  ready: { label: "Siap", className: "bg-gray-100 text-gray-700" },
  hidden: { label: "Tersembunyi", className: "bg-gray-100 text-gray-500" },
  payment_pending: { label: "Menunggu Bayar", className: "bg-yellow-100 text-yellow-800" },
  awaiting_payment: { label: "Menunggu Bayar", className: "bg-yellow-100 text-yellow-800" },
  awaiting_verification: { label: "Verifikasi", className: "bg-purple-100 text-purple-800" },
  awaiting_confirmation: { label: "Konfirmasi", className: "bg-yellow-100 text-yellow-800" },
  // User
  admin: { label: "Admin", className: "bg-purple-100 text-purple-800" },
  pengurus: { label: "Pengurus", className: "bg-blue-100 text-blue-800" },
  relawan: { label: "Relawan", className: "bg-teal-100 text-teal-800" },
  sahabat: { label: "Sahabat", className: "bg-gray-100 text-gray-700" },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
