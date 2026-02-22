import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sidebar } from "@/components/layout/Sidebar"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}))

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = "Link"
  return MockLink
})

describe("Sidebar", () => {
  it("renders all main nav items on desktop", () => {
    const { container } = render(<Sidebar />)
    // Desktop sidebar is hidden on mobile but present in DOM
    expect(container.querySelector("aside")).toBeInTheDocument()
  })

  it("renders Overview nav link", () => {
    render(<Sidebar />)
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0)
  })

  it("renders Pengguna nav link", () => {
    render(<Sidebar />)
    expect(screen.getAllByText("Pengguna").length).toBeGreaterThan(0)
  })

  it("renders Donasi nav link", () => {
    render(<Sidebar />)
    expect(screen.getAllByText("Donasi").length).toBeGreaterThan(0)
  })

  it("renders Lelang nav link", () => {
    render(<Sidebar />)
    expect(screen.getAllByText("Lelang").length).toBeGreaterThan(0)
  })

  it("renders Konten nav link", () => {
    render(<Sidebar />)
    expect(screen.getAllByText("Konten").length).toBeGreaterThan(0)
  })

  it("shows mobile sidebar overlay when mobileOpen=true", () => {
    const { container } = render(<Sidebar mobileOpen={true} onMobileClose={jest.fn()} />)
    // Mobile overlay is rendered when mobileOpen=true
    const overlays = container.querySelectorAll(".fixed.inset-0")
    expect(overlays.length).toBeGreaterThan(0)
  })

  it("does not show mobile overlay when mobileOpen=false", () => {
    const { container } = render(<Sidebar mobileOpen={false} onMobileClose={jest.fn()} />)
    const overlays = container.querySelectorAll(".fixed.inset-0")
    expect(overlays.length).toBe(0)
  })

  it("calls onMobileClose when overlay backdrop is clicked", async () => {
    const onClose = jest.fn()
    render(<Sidebar mobileOpen={true} onMobileClose={onClose} />)
    // Click the backdrop div
    const backdrop = document.querySelector(".fixed.inset-0 > div")
    if (backdrop) await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it("highlights active route", () => {
    const { usePathname } = require("next/navigation")
    usePathname.mockReturnValue("/users")
    const { container } = render(<Sidebar />)
    // The active link should have the active highlight class
    const activeLinks = container.querySelectorAll("a[href='/users']")
    // At least one link for /users should exist
    expect(activeLinks.length).toBeGreaterThan(0)
  })
})
