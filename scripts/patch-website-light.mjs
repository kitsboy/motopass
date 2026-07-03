import { readFileSync, writeFileSync } from 'fs'

const path = 'website/index.html'
let html = readFileSync(path, 'utf8')

// Luminous Sovereign :root — legacy var names remapped for minimal JS churn
const newRoot = `:root {
  --canvas: #F5F2EC;
  --section: #EDE9E3;
  --navy: #F5F2EC;
  --navy2: #FFFFFF;
  --navy3: #FAFAF8;
  --gold: #F7931A;
  --gold2: #E07B0F;
  --gold3: #C46A08;
  --silver: #71717A;
  --text: #18181B;
  --muted: #71717A;
  --btc: #f7931a;
  --green: #16A34A;
  --red: #DC2626;
  --border: #D6D3D1;
  --card-shadow: 0 1px 3px rgba(24,24,27,0.08), 0 4px 16px rgba(24,24,27,0.06);
}`

html = html.replace(/:root \{[\s\S]*?\}/, newRoot)

// Fonts — align with React app
html = html.replace(
  /family=Bebas\+Neue[^"']+/,
  'family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700'
)

// Body typography
html = html.replace(
  "body {\n  font-family: 'Crimson Pro', Georgia, serif;",
  "body {\n  font-family: 'Inter', system-ui, sans-serif;"
)

// Header scrolled — light glass
html = html.replace(
  'background: rgba(6,15,30,0.97);',
  'background: rgba(255,255,255,0.92);'
)
html = html.replace(
  'box-shadow: 0 4px 40px rgba(0,0,0,0.6);',
  'box-shadow: 0 1px 0 rgba(24,24,27,0.06), 0 4px 24px rgba(24,24,27,0.08);'
)

// Dark section backgrounds → light bands
html = html.replace(/background: rgba\(0,0,0,0\.3\)/g, 'background: var(--section)')
html = html.replace(/background: rgba\(0,0,0,0\.5\)/g, 'background: rgba(24,24,27,0.45)')
html = html.replace(/background: rgba\(11,26,48,0\.9\)/g, 'background: var(--navy2)')
html = html.replace(/background: rgba\(0,0,0,0\.2\)/g, 'background: rgba(245,242,236,0.5)')

// Gold hover tints → orange soft
html = html.replace(/rgba\(200,168,75,0\.05\)/g, 'rgba(247,147,26,0.06)')
html = html.replace(/rgba\(200,168,75,0\.06\)/g, 'rgba(247,147,26,0.08)')
html = html.replace(/rgba\(200,168,75,0\.08\)/g, 'rgba(247,147,26,0.1)')
html = html.replace(/rgba\(200,168,75,0\.1\)/g, 'rgba(247,147,26,0.12)')

// Hero glows
html = html.replace(
  'background: radial-gradient(ellipse, rgba(200,168,75,0.1) 0%, transparent 70%);',
  'background: radial-gradient(ellipse, rgba(247,147,26,0.08) 0%, transparent 70%);'
)

// Logo text color
html = html.replace(".logo-text-main {\n  font-family: 'Bebas Neue', sans-serif;", ".logo-text-main {\n  font-family: 'Space Grotesk', sans-serif;\n  font-weight: 600;")
html = html.replace('.font-display { font-family: \'Bebas Neue\', sans-serif; letter-spacing: 0.04em; }', ".font-display { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; font-weight: 600; }")

// Add theme-color if missing
if (!html.includes('theme-color')) {
  html = html.replace('<meta name="viewport"', '<meta name="theme-color" content="#F5F2EC">\n<meta name="viewport"')
}

// Card elevation on program cards
html = html.replace(
  /\.program-card \{[\s\S]*?border: 1px solid var\(--border\);/,
  (m) => m + '\n  box-shadow: var(--card-shadow);'
)

writeFileSync(path, html)
console.log('Patched website/index.html → Luminous Sovereign light theme')