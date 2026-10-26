import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import {
  getClientIp,
  checkRateLimit,
  RATE_LIMIT_CONFIG,
} from "@/lib/rate-limiter"

// Proxy — RBAC & Hybrid Rate Limiting (Next.js 16 convention)
// Runs BEFORE every matched request. JWT-only for pages, Rate-limiter for Auth APIs.

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

  // ── Rate Limiting for Auth APIs (Cloudflare-Aware Hybrid Strategy) ──
  if (
    pathname === "/api/auth/signup" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/forgot-password"
  ) {
    if (request.method.toUpperCase() === "POST") {
      const clientIp = getClientIp(request)

      if (pathname === "/api/auth/signup") {
        // Strict IP limit: 3 requests per hour
        const key = `signup:${clientIp}`
        const result = await checkRateLimit(
          key,
          RATE_LIMIT_CONFIG.signup.limit,
          RATE_LIMIT_CONFIG.signup.windowMs
        )

        if (!result.success) {
          return NextResponse.json(
            { error: "Too many sign-up requests from this IP. Please try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(result.retryAfterSec),
                "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.signup.limit),
                "X-RateLimit-Remaining": "0",
              },
            }
          )
        }
      } else {
        // Compound key strategy for login and forgot-password: IP + normalized email/account
        let identifier = "anonymous"
        try {
          // Stream preservation: clone request before reading JSON body
          const clonedRequest = request.clone()
          const body = await clonedRequest.json()
          const rawTarget =
            body.email || body.loginId || body.username || ""
          if (rawTarget) {
            identifier = String(rawTarget).toLowerCase().trim()
          }
        } catch (_) {
          // Fallback if body parsing fails
        }

        const routePrefix = pathname === "/api/auth/login" ? "login" : "forgot-password"
        const key = `${routePrefix}:${clientIp}:${identifier}`
        const config =
          pathname === "/api/auth/login"
            ? RATE_LIMIT_CONFIG.login
            : RATE_LIMIT_CONFIG.forgotPassword

        const result = await checkRateLimit(key, config.limit, config.windowMs)

        if (!result.success) {
          return NextResponse.json(
            { error: "Too many attempts. Please try again after 15 minutes." },
            {
              status: 429,
              headers: {
                "Retry-After": String(result.retryAfterSec),
                "X-RateLimit-Limit": String(config.limit),
                "X-RateLimit-Remaining": "0",
              },
            }
          )
        }
      }
    }

    return NextResponse.next()
  }

  // ── Page RBAC & Session Management ─────────────────────
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
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/forgot-password",
  ],
}
