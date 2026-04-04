import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

export const runtime = "nodejs"

export async function GET(request, props) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const params = await props.params
        const fileId = Number(params.fileId)

        if (!Number.isFinite(fileId)) {
            return NextResponse.json({ error: "Invalid file id" }, { status: 400 })
        }

        let result
        try {
            result = await pool.query(
                "SELECT filename, content_type, data FROM uploaded_files WHERE id = $1",
                [fileId]
            )
        } catch (err) {
            if (err?.code === "42P01") {
                return NextResponse.json({ error: "File storage table is missing" }, { status: 404 })
            }
            throw err
        }

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        const row = result.rows[0]
        const filename = row.filename || "document.pdf"
        const contentType = row.content_type || "application/pdf"

        return new Response(row.data, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "private, max-age=300",
            },
        })
    } catch (err) {
        console.error("[files GET]", err)
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
    }
}
