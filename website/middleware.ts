import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and public assets
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  const token = request.cookies.get("access_token")?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  try {
    // Decode JWT payload (no verification — server-side verification happens at API)
    const parts = token.split(".")
    if (parts.length !== 3) throw new Error("Invalid token")
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

    const role: string = payload.role || ""
    if (!["admin", "pengurus"].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "access_denied")
      return NextResponse.redirect(url)
    }
  } catch {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
}
