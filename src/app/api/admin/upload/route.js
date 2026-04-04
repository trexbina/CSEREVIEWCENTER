import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"

export const runtime = "nodejs"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

async function ensureUploadsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            content_type TEXT,
            data BYTEA NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)
}

export async function POST(request) {
    try {
        const session = await adminGuard()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const formData = await request.formData()
        const file = formData.get("file")

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        await ensureUploadsTable()

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name || `upload_${Date.now()}.pdf`
        const contentType = file.type || "application/pdf"

        const result = await pool.query(
            "INSERT INTO uploaded_files (filename, content_type, data) VALUES ($1, $2, $3) RETURNING id",
            [filename, contentType, buffer]
        )

        const fileId = result.rows[0]?.id
        if (!fileId) {
            return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            url: `/api/files/${fileId}`,
            name: filename,
        })
    } catch (err) {
        console.error("[admin/upload POST]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
