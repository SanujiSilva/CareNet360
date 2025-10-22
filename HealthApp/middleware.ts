import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

const publicPaths = ["/auth/login", "/auth/register", "/"]
const rolePaths = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/admin",
  pharmacist: "/pharmacist",
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check authentication
  const token = request.cookies.get("auth-token")

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Verify token
  const payload = await verifyToken(token.value)

  if (!payload) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Check role-based access
  const userRolePath = rolePaths[payload.role]
  if (!pathname.startsWith(userRolePath)) {
    return NextResponse.redirect(new URL(userRolePath + "/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
