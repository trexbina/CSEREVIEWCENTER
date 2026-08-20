import fs from 'fs'

const svgContent = fs.readFileSync('public/SVG refference/profileview.svg', 'utf8')

// Let's find some <text> tags with their attributes
const textRegex = /<text\s+[^>]*?x="([^"]+)"\s+y="([^"]+)"[^>]*?>([\s\S]*?)<\/text>/g
let match
const matches = []

while ((match = textRegex.exec(svgContent)) !== null && matches.length < 50) {
  matches.push({
    x: match[1],
    y: match[2],
    text: match[3].replace(/<[^>]+>/g, '').trim()
  })
}

console.log('Top 40 SVG Text Elements:')
matches.slice(0, 40).forEach((m, idx) => {
  console.log(`${idx + 1}. x=${m.x}, y=${m.y}: "${m.text}"`)
})
