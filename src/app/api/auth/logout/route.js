import { NextResponse } from "next/server"
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth"

function clearSessionCookie(response) {
  // Clear standard session cookie
  response.cookies.set("session", "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  })

  // Defensive clears for root path without extra options
  response.cookies.set("session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })

  // Set-Cookie header directly as additional fallback
  response.headers.append(
    "Set-Cookie",
    "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax"
  )

  return response
}

export async function GET(request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get("redirect") || "/"
  // Ensure we redirect to root or requested path with 303 See Other
  const target = redirectTo.startsWith("http") ? redirectTo : new URL(redirectTo, request.url).toString()
  const response = NextResponse.redirect(target, { status: 303 })
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  return clearSessionCookie(response)
}

export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, no-cache" } })
  return clearSessionCookie(response)
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, no-cache" } })
  return clearSessionCookie(response)
}
