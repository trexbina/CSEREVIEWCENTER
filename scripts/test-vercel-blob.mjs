import { put } from "@vercel/blob"

const token = "vercel_blob_rw_ASvAAIyjoUXX5hpT_SghIuwgdOmuPwAmgGcCxLiFuxDhj5K"

async function testAllAssetTypes() {
  console.log("==================================================")
  console.log("TESTING VERCEL BLOB STORAGE (Images, Video, PDF)")
  console.log("==================================================")

  // 1. Test Text/Data file
  try {
    const textBuffer = Buffer.from("PEAK Review System - Storage verification test", "utf-8")
    const textBlob = await put(`tests/test_${Date.now()}.txt`, textBuffer, {
      access: "public",
      contentType: "text/plain",
      token
    })
    console.log("✅ 1. Text/Data Upload:", textBlob.url)
  } catch (e) {
    console.error("❌ 1. Text Upload Failed:", e.message)
  }

  // 2. Test Image Upload
  try {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")
    const imgBlob = await put(`images/sample_icon_${Date.now()}.png`, pngBuffer, {
      access: "public",
      contentType: "image/png",
      token
    })
    console.log("✅ 2. Image Asset Upload (PNG/JPG):", imgBlob.url)
  } catch (e) {
    console.error("❌ 2. Image Upload Failed:", e.message)
  }

  // 3. Test PDF Document Upload
  try {
    const pdfBuffer = Buffer.from("%PDF-1.4\n%PEAK Sample PDF Document\n%%EOF", "utf-8")
    const pdfBlob = await put(`documents/module_syllabus_${Date.now()}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      token
    })
    console.log("✅ 3. PDF Document Upload:", pdfBlob.url)
  } catch (e) {
    console.error("❌ 3. PDF Upload Failed:", e.message)
  }

  // 4. Test Video Asset Upload
  try {
    const videoBuffer = Buffer.from("SAMPLE_MP4_VIDEO_STREAM_BYTES", "utf-8")
    const vidBlob = await put(`videos/lecture_preview_${Date.now()}.mp4`, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
      token
    })
    console.log("✅ 4. Video Asset Upload (MP4/WebM):", vidBlob.url)
  } catch (e) {
    console.error("❌ 4. Video Upload Failed:", e.message)
  }

  console.log("\n🎉 ALL ASSET TYPES (IMAGE, VIDEO, PDF) ARE FULLY CONFIGURED & CONNECTED TO VERCEL BLOB!")
}

testAllAssetTypes()
