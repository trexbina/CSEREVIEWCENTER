/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Prevents Vercel 4.5MB serverless payload limit errors and ensures fast uploads.
 * 
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} [options.maxWidth=800] - Max output width
 * @param {number} [options.maxHeight=800] - Max output height
 * @param {number} [options.quality=0.85] - Output JPEG quality (0.0 to 1.0)
 * @returns {Promise<File>} - Compressed File object
 */
export async function compressImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.85 } = {}) {
  if (typeof window === "undefined" || !file || !file.type?.startsWith("image/")) {
    return file
  }

  // If file is already small (under 100KB), no need to compress
  if (file.size < 100 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (readerEvent) => {
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            const cleanName = (file.name || "avatar.jpg").replace(/\.[^.]+$/, "") + ".jpg"
            const compressedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = readerEvent.target?.result
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

/**
 * Converts a File or Blob into a base64 Data URL (can be used as fallback avatar).
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}
