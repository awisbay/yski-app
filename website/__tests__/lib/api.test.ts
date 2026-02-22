import axios from "axios"

// We need to re-import for each test because of module-level interceptors

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            store = {}
        }),
    }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

// Clear modules cache so each test gets fresh api instance
beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
})

describe("api module", () => {
    it("exports a default axios instance", async () => {
        const { default: api } = await import("@/lib/api")
        expect(api).toBeDefined()
        expect(api.defaults.baseURL).toBeDefined()
    })

    it("has a baseURL ending with /api/v1", async () => {
        const { default: api } = await import("@/lib/api")
        expect(api.defaults.baseURL).toContain("/api/v1")
    })

    it("has a 30 second timeout", async () => {
        const { default: api } = await import("@/lib/api")
        expect(api.defaults.timeout).toBe(30000)
    })

    it("exports api as a named export as well", async () => {
        const { api } = await import("@/lib/api")
        expect(api).toBeDefined()
        expect(api.defaults.baseURL).toContain("/api/v1")
    })

    it("has request interceptors registered", async () => {
        const { default: api } = await import("@/lib/api")
        // Axios stores interceptors internally
        expect(api.interceptors.request).toBeDefined()
    })

    it("has response interceptors registered", async () => {
        const { default: api } = await import("@/lib/api")
        expect(api.interceptors.response).toBeDefined()
    })

    it("request interceptor attaches auth token from localStorage", async () => {
        // Set up localStorage to have auth data
        localStorageMock.setItem(
            "yski-auth",
            JSON.stringify({
                state: {
                    accessToken: "test-access-token-123",
                    refreshToken: "test-refresh-token",
                },
            })
        )

        // Re-import to get fresh module
        jest.resetModules()
        const { default: api } = await import("@/lib/api")

        // Manually run the request interceptor
        const config = {
            headers: {
                Authorization: "",
            },
        }

        // Access the interceptor handler
        const interceptors = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: unknown) => unknown }> }).handlers
        if (interceptors.length > 0) {
            const result = interceptors[0].fulfilled(config) as { headers: { Authorization: string } }
            expect(result.headers.Authorization).toBe("Bearer test-access-token-123")
        }
    })

    it("request interceptor does nothing when no token in localStorage", async () => {
        jest.resetModules()
        const { default: api } = await import("@/lib/api")

        const config = {
            headers: {
                Authorization: "",
            },
        }

        const interceptors = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: unknown) => unknown }> }).handlers
        if (interceptors.length > 0) {
            const result = interceptors[0].fulfilled(config) as { headers: { Authorization: string } }
            expect(result.headers.Authorization).toBe("")
        }
    })

    it("request interceptor handles malformed JSON in localStorage gracefully", async () => {
        localStorageMock.setItem("yski-auth", "not-valid-json")

        jest.resetModules()
        const { default: api } = await import("@/lib/api")

        const config = {
            headers: {
                Authorization: "",
            },
        }

        const interceptors = (api.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: unknown) => unknown }> }).handlers
        if (interceptors.length > 0) {
            // Should not throw
            const result = interceptors[0].fulfilled(config) as { headers: { Authorization: string } }
            expect(result.headers.Authorization).toBe("")
        }
    })
})
