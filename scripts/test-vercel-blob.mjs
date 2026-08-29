import { put } from "@vercel/blob"

async function testBlob() {
  console.log("Testing Vercel Blob upload with BLOB_READ_WRITE_TOKEN from process.env...")
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_fo4E9sf34AeXibcj_sNkr43VOELAZat6HiqcRfYZ53zUiNB"
    const testContent = Buffer.from("PEAK Review System - Vercel Blob Connection Test Successful!", "utf-8")
    const filename = `test_uploads/test_${Date.now()}.txt`

    const blob = await put(filename, testContent, {
      access: "public",
      contentType: "text/plain",
      token: token
    })

    console.log("✅ Vercel Blob upload SUCCESSFUL!")
    console.log("Uploaded Blob URL:", blob.url)
    console.log("Download URL:", blob.downloadUrl)
    console.log("Pathname:", blob.pathname)
  } catch (err) {
    console.error("❌ Vercel Blob test result:", err.message)
  }
}

testBlob()
