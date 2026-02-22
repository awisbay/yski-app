import { act } from "@testing-library/react"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types"

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

// Reset store before each test
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

describe("authStore — setAuth()", () => {
  it("sets user, tokens, and isAuthenticated=true", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, "access-token-123", "refresh-token-456")
    })
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.accessToken).toBe("access-token-123")
    expect(state.refreshToken).toBe("refresh-token-456")
    expect(state.isAuthenticated).toBe(true)
  })
})

describe("authStore — clearAuth()", () => {
  it("resets all auth state to null/false", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, "access", "refresh")
      useAuthStore.getState().clearAuth()
    })
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

describe("authStore — can()", () => {
  it("returns true for admin performing delete on users", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, "t", "r")
    })
    expect(useAuthStore.getState().can("delete", "users")).toBe(true)
  })

  it("returns false for pengurus performing delete on users", () => {
    const pengurusUser = { ...mockUser, role: "pengurus" as const }
    act(() => {
      useAuthStore.getState().setAuth(pengurusUser, "t", "r")
    })
    expect(useAuthStore.getState().can("delete", "users")).toBe(false)
  })

  it("returns true for pengurus approving content", () => {
    const pengurusUser = { ...mockUser, role: "pengurus" as const }
    act(() => {
      useAuthStore.getState().setAuth(pengurusUser, "t", "r")
    })
    expect(useAuthStore.getState().can("approve", "content")).toBe(true)
  })

  it("returns false when user is not authenticated", () => {
    expect(useAuthStore.getState().can("view", "users")).toBe(false)
  })

  it("returns false for unknown resource", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, "t", "r")
    })
    expect(useAuthStore.getState().can("view", "unknown_resource")).toBe(false)
  })

  it("returns false for relawan role (not in permissions map)", () => {
    const relawanUser = { ...mockUser, role: "relawan" as const }
    act(() => {
      useAuthStore.getState().setAuth(relawanUser, "t", "r")
    })
    expect(useAuthStore.getState().can("view", "users")).toBe(false)
  })

  it("admin can change_role", () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, "t", "r")
    })
    expect(useAuthStore.getState().can("change_role", "users")).toBe(true)
  })

  it("pengurus cannot change_role", () => {
    const pengurusUser = { ...mockUser, role: "pengurus" as const }
    act(() => {
      useAuthStore.getState().setAuth(pengurusUser, "t", "r")
    })
    expect(useAuthStore.getState().can("change_role", "users")).toBe(false)
  })
})
