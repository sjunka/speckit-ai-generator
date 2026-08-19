// Regenera docs/GUION-PRESENTACION.pdf desde el .html. Sin LaTeX ni pandoc.
//
//   npm i playwright && npx playwright install chromium
//   node scripts/build-guion-pdf.mjs
//
// Corre esto cada vez que edites el guion, o el PDF queda desactualizado.
import { readFileSync, readdirSync } from 'node:fs'
import os from 'node:os'
import { chromium } from 'playwright'

// Acepta un basename opcional: `node scripts/build-guion-pdf.mjs DIA-D`
const name = process.argv[2] ?? 'GUION-PRESENTACION'
const SRC = new URL(`../docs/${name}.html`, import.meta.url).pathname
const OUT = new URL(`../docs/${name}.pdf`, import.meta.url).pathname

// Playwright a veces no encuentra su propio binario; caemos al shell cacheado.
const cache = `${os.homedir()}/Library/Caches/ms-playwright`
const shells = readdirSync(cache).filter(d => d.startsWith('chromium_headless_shell-')).sort()
  .map(d => `${cache}/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`)
let browser
try { browser = await chromium.launch() } catch { browser = await chromium.launch({ executablePath: shells.at(-1) }) }

const page = await browser.newPage()
await page.setContent(readFileSync(SRC, 'utf8'), { waitUntil: 'load' })
await page.pdf({
  path: OUT,
  format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-size:7pt;color:#9aa0a8;font-family:-apple-system,Arial;padding:0 13mm;display:flex;justify-content:space-between"><span>${name === 'GUION-PRESENTACION' ? 'Guion · 10 minutos' : name}</span><span class="pageNumber"></span></div>`,
  margin: { top: '14mm', bottom: '16mm', left: '13mm', right: '13mm' },
})
await browser.close()
console.log(`listo: ${OUT}`)
