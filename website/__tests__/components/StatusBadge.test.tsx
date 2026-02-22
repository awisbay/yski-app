import React from "react"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/shared/StatusBadge"

describe("StatusBadge", () => {
  it("renders 'Menunggu' for pending status", () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText("Menunggu")).toBeInTheDocument()
  })

  it("renders 'Disetujui' for approved status", () => {
    render(<StatusBadge status="approved" />)
    expect(screen.getByText("Disetujui")).toBeInTheDocument()
  })

  it("renders 'Ditolak' for rejected status", () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText("Ditolak")).toBeInTheDocument()
  })

  it("renders 'Dipublikasikan' for published status", () => {
    render(<StatusBadge status="published" />)
    expect(screen.getByText("Dipublikasikan")).toBeInTheDocument()
  })

  it("renders 'Draft' for draft status", () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText("Draft")).toBeInTheDocument()
  })

  it("renders 'Admin' for admin role", () => {
    render(<StatusBadge status="admin" />)
    expect(screen.getByText("Admin")).toBeInTheDocument()
  })

  it("renders 'Pengurus' for pengurus role", () => {
    render(<StatusBadge status="pengurus" />)
    expect(screen.getByText("Pengurus")).toBeInTheDocument()
  })

  it("renders raw status for unknown values", () => {
    render(<StatusBadge status="unknown_xyz" />)
    expect(screen.getByText("unknown_xyz")).toBeInTheDocument()
  })

  it("applies yellow classes for pending", () => {
    const { container } = render(<StatusBadge status="pending" />)
    expect(container.firstChild).toHaveClass("bg-yellow-100")
    expect(container.firstChild).toHaveClass("text-yellow-800")
  })

  it("applies green classes for approved", () => {
    const { container } = render(<StatusBadge status="approved" />)
    expect(container.firstChild).toHaveClass("bg-green-100")
  })

  it("applies red classes for rejected", () => {
    const { container } = render(<StatusBadge status="rejected" />)
    expect(container.firstChild).toHaveClass("bg-red-100")
  })

  it("applies blue classes for completed", () => {
    const { container } = render(<StatusBadge status="completed" />)
    expect(container.firstChild).toHaveClass("bg-blue-100")
  })

  it("applies orange classes for in_progress", () => {
    const { container } = render(<StatusBadge status="in_progress" />)
    expect(container.firstChild).toHaveClass("bg-orange-100")
  })

  it("merges additional className prop", () => {
    const { container } = render(<StatusBadge status="pending" className="mt-2" />)
    expect(container.firstChild).toHaveClass("mt-2")
  })

  it("renders as an inline span", () => {
    const { container } = render(<StatusBadge status="paid" />)
    expect(container.firstChild?.nodeName).toBe("SPAN")
  })
})
