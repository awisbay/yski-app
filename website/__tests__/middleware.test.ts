/**
 * @jest-environment node
 */
import { proxy } from "@/proxy"
import { NextRequest, NextResponse } from "next/server"

// Helper to build a NextRequest
function makeRequest(pathname: string, cookieToken?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`
  const req = new NextRequest(url)
  if (cookieToken) {
    req.cookies.set("access_token", cookieToken)
  }
  return req
}

// Build a valid-looking JWT with the given payload
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

describe("proxy", () => {
  it("allows /login without a token", () => {
    const req = makeRequest("/login")
    const res = proxy(req)
    // Should not redirect — let the page render
    expect(res).toBeInstanceOf(NextResponse)
    // NextResponse.next() has status 200
    expect(res.status).toBe(200)
  })

  it("redirects to /login when no token is present", () => {
    const req = makeRequest("/")
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("redirects to /login when token is malformed", () => {
    const req = makeRequest("/users", "not.a.valid.jwt")
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("allows admin through to dashboard", () => {
    const token = makeJwt({ sub: "uid-1", role: "admin", exp: 9999999999 })
    const req = makeRequest("/", token)
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it("allows pengurus through to dashboard", () => {
    const token = makeJwt({ sub: "uid-2", role: "pengurus", exp: 9999999999 })
    const req = makeRequest("/users", token)
    const res = proxy(req)
    expect(res.status).toBe(200)
  })

  it("redirects sahabat with access_denied error", () => {
    const token = makeJwt({ sub: "uid-3", role: "sahabat", exp: 9999999999 })
    const req = makeRequest("/", token)
    const res = proxy(req)
    expect(res.status).toBe(307)
    const location = res.headers.get("location") ?? ""
    expect(location).toContain("/login")
    expect(location).toContain("access_denied")
  })

  it("redirects relawan with access_denied error", () => {
    const token = makeJwt({ sub: "uid-4", role: "relawan", exp: 9999999999 })
    const req = makeRequest("/donations", token)
    const res = proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("access_denied")
  })

  it("allows deeply nested dashboard routes for admin", () => {
    const token = makeJwt({ sub: "uid-1", role: "admin", exp: 9999999999 })
    const req = makeRequest("/content/news/some-article-id", token)
    const res = proxy(req)
    expect(res.status).toBe(200)
  })
})
