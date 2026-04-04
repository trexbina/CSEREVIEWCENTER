import { NextResponse } from "next/server"
import { SESSION_COOKIE_OPTIONS } from "@/lib/auth"

function clearSessionCookie(response) {
  response.cookies.set("session", "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  })

  // Extra defensive clear in case old deployments used different attributes.
  response.cookies.set("session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })

  return response
}

export async function GET(request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get("redirect") || "/login"
  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  return clearSessionCookie(response)
}

export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  return clearSessionCookie(response)
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  return clearSessionCookie(response)
}
