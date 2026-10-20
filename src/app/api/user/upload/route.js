import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import pool from "@/lib/db"
import { put } from "@vercel/blob"

export const runtime = "nodejs"
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

async function uploadToBlob(filename, buffer, contentType) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null

  const blob = await put(`avatars/${filename}`, buffer, {
    access: "public",
    token,
    contentType,
  })

  return {
    success: true,
    url: blob.url,
    name: filename,
  }
}

async function insertUploadedFile({ filename, contentType, buffer, size }) {
  const safeSize = Number.isFinite(size) ? Number(size) : buffer.length

  try {
    return await pool.query(
      "INSERT INTO uploaded_files (filename, content_type, size, data) VALUES ($1, $2, $3, $4) RETURNING id",
      [filename, contentType, safeSize, buffer]
    )
  } catch (err) {
    if (err?.code === "42P01") {
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
      return await pool.query(
        "INSERT INTO uploaded_files (filename, content_type, size, data) VALUES ($1, $2, $3, $4) RETURNING id",
        [filename, contentType, safeSize, buffer]
      )
    }
    throw err
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Invalid file payload" }, { status: 400 })
    }

    // Validate image MIME type
    const contentType = file.type || "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed for profile pictures." }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image file is too large. Please select an image under 5 MB." },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeOriginalName = String(file.name || "avatar.jpg").replace(/[^a-zA-Z0-9._-]/g, "")
    const filename = `${session.userId}_${Date.now()}_${safeOriginalName}`

    // 1. Try Vercel Blob Object Storage
    try {
      const blobResult = await uploadToBlob(filename, buffer, contentType)
      if (blobResult?.url) {
        return NextResponse.json(blobResult)
      }
    } catch (blobErr) {
      console.warn("[user/upload blob fallback]", blobErr?.message)
    }

    // 2. Fall back to PostgreSQL uploaded_files table
    try {
      const result = await insertUploadedFile({ filename, contentType, buffer, size: file.size })
      const fileId = result.rows[0]?.id
      if (fileId) {
        return NextResponse.json({
          success: true,
          url: `/api/files/${fileId}`,
          name: filename,
        })
      }
    } catch (dbErr) {
      console.warn("[user/upload db fallback error]", dbErr?.message)
    }

    // 3. Ultra-fallback: return base64 data URI if image is under 200KB so user is never blocked
    if (buffer.length < 250 * 1024) {
      const base64 = buffer.toString("base64")
      const dataUrl = `data:${contentType};base64,${base64}`
      return NextResponse.json({
        success: true,
        url: dataUrl,
        name: filename,
      })
    }

    return NextResponse.json({ error: "Failed to save profile picture." }, { status: 500 })
  } catch (err) {
    console.error("[user/upload POST error]", err)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
