import fs from 'fs'
import path from 'path'

const svgPath = 'public/SVG refference/profileview.svg'
const outputDir = 'public/images'

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

try {
  console.log('Reading SVG file...')
  const svgContent = fs.readFileSync(svgPath, 'utf8')
  console.log('SVG file read successfully. Length:', svgContent.length)

  // Use regex to find all <image> elements with base64 data
  const imageRegex = /<image\s+id="([^"]+)"[^>]*?xlink:href="data:image\/([^;]+);base64,([^"]+)"/g
  let match
  let count = 0

  while ((match = imageRegex.exec(svgContent)) !== null) {
    const id = match[1]
    const ext = match[2]
    const base64Data = match[3]
    
    const outputFilename = `${id}.${ext === 'jpeg' ? 'jpg' : ext}`
    const outputPath = path.join(outputDir, outputFilename)
    
    console.log(`Extracting ${id} (${ext}) to ${outputPath}...`)
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'))
    console.log(`Extracted ${id} successfully.`)
    count++
  }

  console.log(`Extraction complete. Extracted ${count} images.`)
} catch (error) {
  console.error('Error extracting images:', error)
}
