import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

// Proxy — RBAC (Next.js 16 convention, replaces middleware.js)
// Runs BEFORE every matched request. JWT-only — no DB.
// Session = 1 hour. Expired/invalid token → cookie cleared → login.

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

const ROUTE_PERMISSIONS = {
  "/student": ["student", ...ADMIN_ROLES],
  "/teacher": ["teacher", ...ADMIN_ROLES],
  "/admin":   ADMIN_ROLES,
}

const AUTH_ROUTES = ["/login"]

const ROLE_HOME = {
  student: "/student",
  teacher: "/teacher/modules",
  admin:   "/admin",
  super_admin: "/admin",
  academic_admin: "/admin",
  registrar: "/admin",
}

const DEFAULT_HOME = "/student"
const LOGIN_PATH   = "/?login=1"

/** Clear the session cookie on a response. */
function clearSessionCookie(response) {
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return response
}

/**
 * Read + verify JWT from cookie.
 * Returns { session, staleToken } — staleToken is true when a cookie
 * exists but the JWT inside is expired or invalid.
 */
async function getSession(request) {
  const token = request.cookies.get("session")?.value
  if (!token) return { session: null, staleToken: false }

  const payload = await verifyToken(token)
  if (!payload?.userId || !payload?.role) {
    return { session: null, staleToken: true } // cookie present, JWT bad
  }
  return {
    session: { userId: payload.userId, role: payload.role, email: payload.email },
    staleToken: false,
  }
}

export default async function proxy(request) {
  const { pathname } = request.nextUrl
  const { session, staleToken } = await getSession(request)

  // ── No valid session ──────────────────────────────────
  if (!session) {
    // Auth pages → let through (but clear dead cookie if present)
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      const res = NextResponse.next()
      return staleToken ? clearSessionCookie(res) : res
    }

    // Protected page → redirect to login + clear dead cookie
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const res = NextResponse.redirect(loginUrl)
    return staleToken ? clearSessionCookie(res) : res
  }

  // ── Logged-in user visiting /login or /register → go home ─
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[session.role] || DEFAULT_HOME, request.url)
    )
  }

  // ── RBAC check ────────────────────────────────────────
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(prefix)) {
      const isCustomAdmin = prefix === "/admin" && session.role !== "student" && session.role !== "teacher"
      if (!allowedRoles.includes(session.role) && !isCustomAdmin) {
        return NextResponse.redirect(
          new URL(ROLE_HOME[session.role] || (session.role !== "student" && session.role !== "teacher" ? "/admin" : DEFAULT_HOME), request.url)
        )
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/login",
  ],
}
