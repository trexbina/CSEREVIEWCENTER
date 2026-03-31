import "server-only"
import { cookies } from "next/headers"
import { verifyToken } from "./auth"

/**
 * Read session from cookie in Server Components / layouts.
 * Returns { userId, role, email } or null.
 *
 * ⚠️ ONLY import this in pages/layouts that ACTUALLY need the session.
 *    Importing this makes the page DYNAMIC (kills prefetch caching).
 *    Auth protection is already handled by proxy.js — you don't need
 *    this just to guard a page.
 */
export async function getSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    if (!token) return null
    return verifyToken(token)
}
