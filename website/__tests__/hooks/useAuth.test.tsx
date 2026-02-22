import { act, renderHook } from "@testing-library/react"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types"

const mockAdmin: User = {
  id: "admin-id",
  full_name: "Super Admin",
  email: "admin@yski.org",
  phone: null,
  avatar_url: null,
  role: "admin",
  is_active: true,
  last_login_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
}

beforeEach(() => {
  act(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  })
})

describe("useAuth()", () => {
  it("returns isAuthenticated=false initially", () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("returns the user after setAuth", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockAdmin, "access", "refresh")
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual(mockAdmin)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("can() returns correct permissions for admin", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockAdmin, "access", "refresh")
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.can("delete", "users")).toBe(true)
    expect(result.current.can("approve", "content")).toBe(true)
    expect(result.current.can("change_role", "users")).toBe(true)
  })

  it("can() returns false for unauthenticated", () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.can("view", "users")).toBe(false)
  })

  it("clearAuth resets state", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockAdmin, "access", "refresh")
      useAuthStore.getState().clearAuth()
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
