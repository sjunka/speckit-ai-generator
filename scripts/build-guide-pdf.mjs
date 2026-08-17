// Regenera docs/GUIA-SPEC-KIT.pdf desde el .md. Sin LaTeX ni pandoc.
//
//   npm i marked playwright && npx playwright install chromium
//   node scripts/build-guide-pdf.mjs
//
// Corre esto cada vez que edites la guía, o el PDF queda desactualizado.
import { readFileSync, readdirSync } from 'node:fs'
import os from 'node:os'
import { marked } from 'marked'
import { chromium } from 'playwright'

const SRC = new URL('../docs/GUIA-SPEC-KIT.md', import.meta.url).pathname
const OUT = new URL('../docs/GUIA-SPEC-KIT.pdf', import.meta.url).pathname

marked.setOptions({ gfm: true, breaks: false })
const md = readFileSync(SRC, 'utf8')

// The first h1 becomes the cover block, so drop it from the body.
const body = marked.parse(md.replace(/^#\s+.+\n/, ''))

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm 16mm 20mm; }

  :root {
    --ink: #16181d;
    --ink-soft: #4a4f57;
    --ink-faint: #7c828c;
    --rule: #dcdfe4;
    --rule-soft: #eceef1;
    --accent: #4f46e5;
    --code-bg: #f5f6f8;
  }

  * { box-sizing: border-box; }

  body {
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.2pt;
    line-height: 1.55;
    color: var(--ink);
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }

  /* Cover ------------------------------------------------------------- */
  .cover { break-after: page; padding-top: 52mm; }
  .cover .eyebrow {
    font-size: 8.5pt; letter-spacing: .16em; text-transform: uppercase;
    color: var(--accent); font-weight: 600; margin-bottom: 10mm;
  }
  .cover h1 {
    font-size: 30pt; line-height: 1.1; letter-spacing: -.02em;
    font-weight: 700; margin: 0 0 6mm; border: 0; padding: 0;
  }
  .cover .sub { font-size: 12pt; color: var(--ink-soft); max-width: 118mm; margin: 0 0 16mm; }
  .cover .meta {
    border-top: 1.5px solid var(--ink); padding-top: 4mm;
    font-size: 9pt; color: var(--ink-faint); display: flex; gap: 8mm; flex-wrap: wrap;
  }
  .cover .meta b { color: var(--ink); font-weight: 600; }

  /* Headings ---------------------------------------------------------- */
  h2 {
    font-size: 15pt; font-weight: 700; letter-spacing: -.01em;
    margin: 11mm 0 3.5mm; padding-bottom: 2mm;
    border-bottom: 1.5px solid var(--ink);
    break-after: avoid; break-inside: avoid;
  }
  h2:first-of-type { margin-top: 0; }
  h3 {
    font-size: 11.5pt; font-weight: 650; margin: 7mm 0 2.5mm;
    color: var(--ink); break-after: avoid;
  }

  p { margin: 0 0 3mm; }
  strong { font-weight: 650; }
  a { color: var(--accent); text-decoration: none; }

  ul, ol { margin: 0 0 3mm; padding-left: 5.5mm; }
  li { margin-bottom: 1.2mm; }
  li::marker { color: var(--ink-faint); }
  input[type=checkbox] { margin-right: 1.5mm; transform: scale(.9); }

  /* Code -------------------------------------------------------------- */
  code {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 8.8pt;
    background: var(--code-bg);
    padding: .4mm 1.2mm;
    border-radius: 2px;
    color: #1f2430;
  }
  pre {
    background: var(--code-bg);
    border: 1px solid var(--rule-soft);
    border-left: 2.5px solid var(--accent);
    border-radius: 3px;
    padding: 3mm 4mm;
    margin: 0 0 4mm;
    overflow: hidden;
    break-inside: avoid;
  }
  pre code {
    background: none; padding: 0; font-size: 8.4pt; line-height: 1.5;
    white-space: pre-wrap; word-break: break-word;
  }

  /* Tables ------------------------------------------------------------ */
  table {
    width: 100%; border-collapse: collapse; margin: 0 0 4mm;
    font-size: 9.2pt; break-inside: avoid;
  }
  th {
    text-align: left; font-weight: 650; background: #f0f1f4;
    padding: 2mm 2.5mm; border-bottom: 1.5px solid var(--ink);
    font-size: 8.6pt; letter-spacing: .01em;
  }
  td {
    padding: 2mm 2.5mm; border-bottom: 1px solid var(--rule);
    vertical-align: top;
  }
  tr:last-child td { border-bottom: 1px solid var(--rule); }
  td code, th code { font-size: 8.2pt; }

  /* Blockquote & rule -------------------------------------------------- */
  blockquote {
    margin: 0 0 4mm; padding: 2.5mm 4mm;
    border-left: 2.5px solid var(--accent);
    background: #f7f7fb; color: var(--ink-soft);
    break-inside: avoid;
  }
  blockquote p:last-child { margin-bottom: 0; }

  hr { border: 0; border-top: 1px solid var(--rule); margin: 8mm 0; }
</style></head><body>

<div class="cover">
  <div class="eyebrow">Guía de implementación</div>
  <h1>Construir la app<br>con Spec Kit</h1>
  <p class="sub">AI Media Generator — 39 tickets en 6 fases, listos para ejecutar.</p>
  <div class="meta">
    <span><b>Repo</b> github.com/sjunka/speckit-ai-generator</span>
    <span><b>Feature</b> 001-ai-media-generator</span>
    <span><b>Fecha</b> ${new Date().toISOString().slice(0, 10)}</span>
  </div>
</div>

${body}
</body></html>`

const cache = `${os.homedir()}/Library/Caches/ms-playwright`
const shells = readdirSync(cache)
  .filter((d) => d.startsWith('chromium_headless_shell-'))
  .sort()
  .map((d) => `${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`)

let browser
try {
  browser = await chromium.launch()
} catch {
  browser = await chromium.launch({ executablePath: shells.at(-1) })
}

const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'load' })
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:7.5pt;color:#9aa0a8;font-family:-apple-system,Arial,sans-serif;padding:0 16mm;display:flex;justify-content:space-between;">' +
    '<span>Guía Spec Kit · AI Media Generator</span>' +
    '<span class="pageNumber"></span></div>',
  margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
})
await browser.close()
console.log('wrote', OUT)
