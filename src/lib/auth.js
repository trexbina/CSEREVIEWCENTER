import { SignJWT, jwtVerify } from "jose"

// JWT Helpers — Edge-safe (jose, no native crypto deps)
// Used by: API routes (sign), proxy.js (verify)
// ⚠️ No cookies() here — keeps this module static-safe.
//    For getSession(), import from "@/lib/auth-session" instead.

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production-32chars!"
)

const ALG = "HS256"

/** Create a signed JWT. Called ONLY in API routes (after DB check). */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)
}

/** Verify and decode a JWT. Returns payload or null. Pure crypto, no DB. */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

/** Cookie options shared by login, register, and logout routes. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days — matches JWT expiry
}

export const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

/** Role → home page mapping. */
export const ROLE_HOME = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  super_admin: "/admin",
  academic_admin: "/admin",
  registrar: "/admin",
}
