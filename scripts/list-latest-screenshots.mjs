import fs from 'fs'
import path from 'path'

const dirPath = 'C:\\Users\\luthe\\.gemini\\antigravity\\brain\\174c035b-ce36-42ca-b2d1-8950286acc49\\.tempmediaStorage'

try {
  const files = fs.readdirSync(dirPath)
  const pngFiles = files
    .filter(f => f.endsWith('.png'))
    .map(f => {
      const filePath = path.join(dirPath, f)
      const stats = fs.statSync(filePath)
      return {
        name: f,
        path: filePath,
        mtime: stats.mtime
      }
    })
    .sort((a, b) => b.mtime - a.mtime)

  console.log('Latest PNG screenshots in .tempmediaStorage:')
  pngFiles.slice(0, 15).forEach(f => {
    console.log(`- File: ${f.name}\n  Path: ${f.path}\n  Modified: ${f.mtime.toISOString()}\n`)
  })
} catch (error) {
  console.error('Error listing files:', error)
}
