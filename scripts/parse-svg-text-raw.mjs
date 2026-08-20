import fs from 'fs'

const svgContent = fs.readFileSync('public/SVG refference/profileview.svg', 'utf8')

// Find a few occurrences of '<text'
let pos = 0
let count = 0
console.log('Finding text/tspan occurrences:')

while (count < 25) {
  const index = svgContent.indexOf('<text', pos)
  if (index === -1) break
  
  const endIdx = svgContent.indexOf('</text>', index)
  if (endIdx === -1) break
  
  const chunk = svgContent.substring(index, endIdx + 7)
  console.log(`Match ${count + 1}:`)
  console.log(chunk.substring(0, 300) + (chunk.length > 300 ? '...' : ''))
  console.log('---')
  
  pos = endIdx + 7
  count++
}

if (count === 0) {
  // Try finding tspan
  pos = 0
  while (count < 10) {
    const index = svgContent.indexOf('<tspan', pos)
    if (index === -1) break
    const endIdx = svgContent.indexOf('</tspan>', index)
    if (endIdx === -1) break
    const chunk = svgContent.substring(index, endIdx + 8)
    console.log(`tspan Match ${count + 1}:`, chunk)
    pos = endIdx + 8
    count++
  }
}
