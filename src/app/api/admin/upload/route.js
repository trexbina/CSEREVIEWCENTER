import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { put } from "@vercel/blob"

export const runtime = "nodejs"

async function adminGuard() {
    const session = await getSession()
    if (session?.role !== "admin") return null
    return session
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

        const buffer = Buffer.from(await file.arrayBuffer())
        // Replace spaces to prevent URL issues
        const filename = Date.now() + "_" + file.name.replace(/\s+/g, "_")

        if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) {
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                return NextResponse.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 })
            }

            const blob = await put(filename, buffer, {
                access: "public",
                contentType: file.type || "application/octet-stream",
            })

            return NextResponse.json({
                success: true,
                url: blob.url,
                name: file.name,
            })
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads")

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (err) {
            if (err.code !== "EEXIST") throw err
        }

        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            success: true,
            url: `/uploads/${filename}`,
            name: file.name,
        })
    } catch (err) {
        console.error("[admin/upload POST]", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
