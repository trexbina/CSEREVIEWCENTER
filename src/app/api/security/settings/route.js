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
      `SELECT watermark_enabled, watermark_text, watermark_opacity, watermark_size, watermark_count FROM system_security_settings WHERE id = 1`
    ).catch(() => ({ rows: [] }))

    const config = rows[0] || {
      watermark_enabled: true,
      watermark_text: "{name} - {email}",
      watermark_opacity: 15,
      watermark_size: "medium",
      watermark_count: 1
    }

    const rawSize = String(config.watermark_size ?? "100").toLowerCase()
    let parsedSize = parseInt(rawSize, 10)
    if (rawSize === "small") parsedSize = 75
    else if (rawSize === "large") parsedSize = 130
    else if (rawSize === "medium" || isNaN(parsedSize)) parsedSize = 100
    parsedSize = Math.min(200, Math.max(50, parsedSize))

    return NextResponse.json({
      watermark: {
        enabled: config.watermark_enabled ?? true,
        template: config.watermark_text || "{name} - {email}",
        opacity: (config.watermark_opacity ?? 15) / 100,
        size: parsedSize,
        count: Math.min(3, Math.max(1, parseInt(config.watermark_count, 10) || 1))
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
        opacity: 0.15,
        size: 100,
        count: 1
      }
    })
  }
}
