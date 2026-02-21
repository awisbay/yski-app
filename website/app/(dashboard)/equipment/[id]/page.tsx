"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Edit } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared/StatusBadge"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import type { MedicalEquipment, EquipmentLoan } from "@/types"

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", id],
    queryFn: () => api.get<MedicalEquipment>(`/equipment/${id}`).then((r) => r.data),
  })

  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["equipment-loans", id],
    queryFn: () =>
      api
        .get<EquipmentLoan[]>("/equipment/loans", { params: { equipment_id: id, limit: 50 } })
        .then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Alat kesehatan tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  const activeLoans = loans.filter((l) => l.status === "approved" || l.status === "borrowed")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-sm text-gray-500 capitalize">{equipment.category}</p>
          </div>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/equipment/${id}?edit=true`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {equipment.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={equipment.photo_url}
                alt={equipment.name}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Status</Label>
                <StatusBadge status={equipment.is_active ? "active" : "cancelled"} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Kondisi</Label>
                <StatusBadge status={equipment.condition} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{equipment.total_stock}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Stok</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">{equipment.available_stock}</p>
                  <p className="text-xs text-gray-500 mt-1">Tersedia</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-gray-500">Ditambahkan</Label>
                <p className="text-sm text-gray-900 mt-0.5">{formatDate(equipment.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details + loans */}
        <div className="lg:col-span-2 space-y-4">
          {equipment.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{equipment.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Peminjaman Aktif
                {activeLoans.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({activeLoans.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : activeLoans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Tidak ada peminjaman aktif</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeLoans.map((loan) => (
                    <div key={loan.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{loan.borrower_name}</p>
                        <p className="text-xs text-gray-500">{loan.borrower_phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(loan.borrow_date)} — {formatDate(loan.return_date)}
                        </p>
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : loans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Belum ada riwayat peminjaman</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Peminjam</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Pinjam</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Kembali</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50/50">
                          <td className="py-2.5">
                            <p className="font-medium text-gray-900">{loan.borrower_name}</p>
                            <p className="text-xs text-gray-400">{loan.borrower_phone}</p>
                          </td>
                          <td className="py-2.5 text-gray-700">{formatDate(loan.borrow_date)}</td>
                          <td className="py-2.5 text-gray-700">{formatDate(loan.return_date)}</td>
                          <td className="py-2.5">
                            <StatusBadge status={loan.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
