import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { put } from "@vercel/blob"

export const runtime = "nodejs"
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 4 * 1024 * 1024)

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
}

async function createUploadsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            content_type TEXT,
            size BIGINT NOT NULL DEFAULT 0,
            data BYTEA NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)
}

async function insertUploadedFile({ filename, contentType, buffer, size }) {
    const safeSize = Number.isFinite(size) ? Number(size) : buffer.length

    const insertWithSizeQuery =
        "INSERT INTO uploaded_files (filename, content_type, size, data) VALUES ($1, $2, $3, $4) RETURNING id"

    const insertWithoutSizeQuery =
        "INSERT INTO uploaded_files (filename, content_type, data) VALUES ($1, $2, $3) RETURNING id"

    try {
        return await pool.query(
            insertWithSizeQuery,
            [filename, contentType, safeSize, buffer]
        )
    } catch (err) {
        // Undefined table: try to create once, then retry insert.
        if (err?.code === "42P01") {
            try {
                await createUploadsTable()
            } catch (createErr) {
                if (createErr?.code === "42501") {
                    throw new Error("DB user cannot create table uploaded_files. Create it manually or use BLOB_READ_WRITE_TOKEN.")
                }
                throw createErr
            }

            return await pool.query(
                insertWithSizeQuery,
                [filename, contentType, safeSize, buffer]
            )
        }

        // Some environments may still use an older table without the size column.
        if (err?.code === "42703") {
            return await pool.query(insertWithoutSizeQuery, [filename, contentType, buffer])
        }

        throw err
    }
}

async function uploadToBlob(filename, buffer, contentType) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return null

    const blob = await put(filename, buffer, {
        access: "public",
        contentType,
    })

    return {
        success: true,
        url: blob.url,
        name: filename,
    }
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

        if (typeof file.arrayBuffer !== "function") {
            return NextResponse.json({ error: "Invalid file payload" }, { status: 400 })
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                {
                    error: `File too large. Max allowed is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB on this deployment.`,
                },
                { status: 413 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const safeOriginalName = String(file.name || "upload.bin").replace(/\s+/g, "_")
        const filename = `${Date.now()}_${safeOriginalName}`
        const contentType = file.type || "application/octet-stream"

        // Prefer object storage when configured, then fall back to DB binary storage.
        try {
            const blobResult = await uploadToBlob(filename, buffer, contentType)
            if (blobResult) {
                return NextResponse.json(blobResult)
            }
        } catch (blobErr) {
            console.error("[admin/upload blob fallback]", blobErr)
        }

        const result = await insertUploadedFile({ filename, contentType, buffer, size: file.size })

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
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
    }
}
