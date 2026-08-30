import pool from "@/lib/db"
import { put } from "@vercel/blob"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

/**
 * Uploads a file buffer safely across both Vercel serverless (read-only filesystem)
 * and local dev environments.
 * 
 * Strategy:
 * 1. If Vercel Blob token is available (`BLOB_READ_WRITE_TOKEN`), upload to Vercel Blob store.
 * 2. If running on Vercel or cloud serverless without blob token, save into PostgreSQL `uploaded_files` table (served via `/api/files/:id`).
 * 3. In local development or fallback, write to disk under `public/uploads/{subfolder}`.
 */
export async function saveUploadedFile(file, subfolder = "general") {
    if (!file || typeof file === "string") return null

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const safeOriginalName = String(file.name || "upload.png").replace(/[^a-zA-Z0-9._-]/g, "")
        const filename = `${Date.now()}-${safeOriginalName}`
        const contentType = file.type || "image/png"

        // 1. Try Vercel Blob Object Storage
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const blob = await put(`${subfolder}/${filename}`, buffer, {
                    access: "public",
                    contentType,
                })
                if (blob?.url) return blob.url
            } catch (blobErr) {
                console.error("[saveUploadedFile] Blob upload fallback error:", blobErr)
            }
        }

        // 2. Try PostgreSQL bytea storage if in production (Vercel has read-only filesystem)
        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
            try {
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

                const res = await pool.query(
                    "INSERT INTO uploaded_files (filename, content_type, size, data) VALUES ($1, $2, $3, $4) RETURNING id",
                    [filename, contentType, buffer.length, buffer]
                )

                const fileId = res.rows[0]?.id
                if (fileId) {
                    return `/api/files/${fileId}`
                }
            } catch (dbErr) {
                console.error("[saveUploadedFile] Database binary upload fallback error:", dbErr)
            }
        }

        // 3. Local filesystem storage (works in dev / container with write permissions)
        try {
            const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder)
            await mkdir(uploadDir, { recursive: true })
            const filepath = path.join(uploadDir, filename)
            await writeFile(filepath, buffer)
            return `/uploads/${subfolder}/${filename}`
        } catch (fsErr) {
            console.error("[saveUploadedFile] Filesystem write error:", fsErr)

            // Final fallback to DB storage if local filesystem write failed
            try {
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

                const res = await pool.query(
                    "INSERT INTO uploaded_files (filename, content_type, size, data) VALUES ($1, $2, $3, $4) RETURNING id",
                    [filename, contentType, buffer.length, buffer]
                )
                const fileId = res.rows[0]?.id
                if (fileId) return `/api/files/${fileId}`
            } catch (innerDbErr) {
                console.error("[saveUploadedFile] Final DB fallback error:", innerDbErr)
            }
        }

        return null
    } catch (err) {
        console.error("[saveUploadedFile] Fatal error:", err)
        return null
    }
}
