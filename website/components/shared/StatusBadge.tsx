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
  // News category
  general: { label: "Umum", className: "bg-slate-100 text-slate-800" },
  kesehatan: { label: "Kesehatan", className: "bg-emerald-100 text-emerald-800" },
  bencana: { label: "Bencana", className: "bg-amber-100 text-amber-800" },
  pendidikan: { label: "Pendidikan", className: "bg-sky-100 text-sky-800" },
  lain_lain: { label: "Lain-lain", className: "bg-gray-100 text-gray-700" },
  // Pickup type
  zakat: { label: "Zakat", className: "bg-yellow-100 text-yellow-800" },
  sedekah: { label: "Sedekah", className: "bg-green-100 text-green-800" },
  jelantah: { label: "Jelantah", className: "bg-orange-100 text-orange-800" },
  barang_bekas: { label: "Barang Bekas", className: "bg-indigo-100 text-indigo-800" },
  donasi: { label: "Donasi", className: "bg-teal-100 text-teal-800" },
  kencleng: { label: "Kencleng", className: "bg-lime-100 text-lime-800" },
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
