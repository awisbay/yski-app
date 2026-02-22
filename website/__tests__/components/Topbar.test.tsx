import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Topbar } from "@/components/layout/Topbar"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types"
import { act } from "@testing-library/react"

// Mock next/navigation
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock sonner
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

// Mock api
jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { post: jest.fn().mockResolvedValue({}) },
}))

const mockUser: User = {
  id: "user-uuid-1",
  full_name: "Ahmad Fauzi",
  email: "admin@yski.org",
  phone: "08123456789",
  avatar_url: null,
  role: "admin",
  is_active: true,
  last_login_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  act(() => {
    useAuthStore.setState({
      user: mockUser,
      accessToken: "token",
      refreshToken: "refresh",
      isAuthenticated: true,
    })
  })
})

describe("Topbar", () => {
  it("renders the user full name", () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.getByText("Ahmad Fauzi")).toBeInTheDocument()
  })

  it("renders user initials as avatar fallback", () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.getByText("AF")).toBeInTheDocument()
  })

  it("renders role label 'Admin' for admin role", () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.getByText("Admin")).toBeInTheDocument()
  })

  it("renders 'Pengurus' for pengurus role", () => {
    act(() => {
      useAuthStore.setState({
        user: { ...mockUser, role: "pengurus" },
      })
    })
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.getByText("Pengurus")).toBeInTheDocument()
  })

  it("renders breadcrumb when provided", () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} breadcrumb="Manajemen Pengguna" />)
    expect(screen.getByText("Manajemen Pengguna")).toBeInTheDocument()
  })

  it("does not render breadcrumb when not provided", () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.queryByText("Manajemen Pengguna")).not.toBeInTheDocument()
  })

  it("calls onMobileMenuToggle when menu button is clicked", async () => {
    const onToggle = jest.fn()
    const { container } = render(<Topbar onMobileMenuToggle={onToggle} />)
    // The mobile menu button is the first button with the Menu icon
    const menuButton = container.querySelector("button.lg\\:hidden")
    if (menuButton) await userEvent.click(menuButton)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("renders the notification bell icon", () => {
    const { container } = render(<Topbar onMobileMenuToggle={jest.fn()} />)
    // Bell renders as an SVG
    const svgs = container.querySelectorAll("svg")
    expect(svgs.length).toBeGreaterThanOrEqual(1)
  })

  it("renders user email in dropdown", async () => {
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    // Click the avatar/trigger to open dropdown
    const triggerBtn = screen.getByText("Ahmad Fauzi").closest("button")
    if (triggerBtn) await userEvent.click(triggerBtn)
    // Email should appear in the dropdown label
    expect(screen.getByText("admin@yski.org")).toBeInTheDocument()
  })

  it("renders '?' initials when user is null", () => {
    act(() => {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    })
    render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(screen.getByText("?")).toBeInTheDocument()
  })

  it("renders header element", () => {
    const { container } = render(<Topbar onMobileMenuToggle={jest.fn()} />)
    expect(container.querySelector("header")).toBeInTheDocument()
  })
})
