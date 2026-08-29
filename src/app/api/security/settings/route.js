import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

/** GET /api/security/settings — public read for logged-in users (students, teachers, admins) to get active watermark rules */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows } = await pool.query(
      `SELECT watermark_enabled, watermark_text, watermark_opacity FROM system_security_settings WHERE id = 1`
    ).catch(() => ({ rows: [] }))

    const config = rows[0] || {
      watermark_enabled: true,
      watermark_text: "{name} - {email}",
      watermark_opacity: 15
    }

    return NextResponse.json({
      watermark: {
        enabled: config.watermark_enabled ?? true,
        template: config.watermark_text || "{name} - {email}",
        opacity: (config.watermark_opacity ?? 15) / 100
      },
      user: {
        name: session.name || "Student",
        email: session.email || ""
      }
    })
  } catch (error) {
    console.error("[GET /api/security/settings] Error:", error)
    return NextResponse.json({
      watermark: {
        enabled: true,
        template: "{name} - {email}",
        opacity: 0.15
      }
    })
  }
}
