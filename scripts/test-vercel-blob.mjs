import { put } from "@vercel/blob"

const token = "vercel_blob_rw_fo4E9sf34AeXibcj_sNkr43VOELAZat6HiqcRfYZ53zUiNB"

async function testBlob() {
  console.log("Testing Vercel Blob upload without hardcoded public access...")
  try {
    const testContent = Buffer.from("PEAK Review System - Vercel Blob Connection Test Successful!", "utf-8")
    const filename = `test_uploads/test_${Date.now()}.txt`

    // Do not pass access: "public" if store is private
    const blob = await put(filename, testContent, {
      contentType: "text/plain",
      token: token
    })

    console.log("✅ Vercel Blob is 100% FUNCTIONAL!")
    console.log("Uploaded Blob URL:", blob.url)
    console.log("Download URL:", blob.downloadUrl)
    console.log("Pathname:", blob.pathname)
  } catch (err) {
    console.error("❌ Vercel Blob test failed:", err)
  }
}

testBlob()
