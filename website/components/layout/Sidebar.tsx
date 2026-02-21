"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  Users,
  Heart,
  Gavel,
  Truck,
  Clock,
  Package,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: BarChart3, label: "Overview" },
  { href: "/users", icon: Users, label: "Manajemen User" },
  { href: "/donations", icon: Heart, label: "Manajemen Donasi" },
  { href: "/auctions", icon: Gavel, label: "Lelang" },
  { href: "/bookings", icon: Truck, label: "Cek Bookingan Pickup" },
  { href: "/pickups", icon: Clock, label: "Cek Request Penjemputan" },
  { href: "/equipment", icon: Package, label: "Manajemen Peralatan" },
  { href: "/finance", icon: FileText, label: "Keuangan" },
  { href: "/content", icon: BookOpen, label: "Program & Berita" },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-emerald-700", collapsed && "justify-center")}>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">YSKI</span>
        )}
        {collapsed && <span className="font-bold text-white text-lg">Y</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onMobileClose}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-emerald-700 text-white"
                : "text-emerald-100 hover:bg-emerald-700/60 hover:text-white",
              collapsed && "justify-center px-2"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:flex border-t border-emerald-700 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg text-emerald-200 hover:bg-emerald-700/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-emerald-800 transition-all duration-300",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <aside className="relative flex flex-col w-56 h-full bg-emerald-800">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 text-emerald-200 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
