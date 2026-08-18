// Extrae un archivo textual de docs/REPLICATION-APPENDIX.md y lo escribe en disco.
//   node scripts/extract-from-appendix.mjs app/globals.css [...mas archivos]
// El apendice es la respuesta correcta (constitucion, principio VI).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const md = readFileSync('docs/REPLICATION-APPENDIX.md', 'utf8')

for (const target of process.argv.slice(2)) {
  const head = '### `' + target + '`'
  const i = md.indexOf(head)
  if (i < 0) { console.error(`NO ENCONTRADO: ${target}`); process.exitCode = 1; continue }
  const fenceStart = md.indexOf('\n```', i)
  const bodyStart = md.indexOf('\n', fenceStart + 1) + 1
  const fenceEnd = md.indexOf('\n```', bodyStart)
  if (fenceStart < 0 || fenceEnd < 0) { console.error(`FENCE ROTO: ${target}`); process.exitCode = 1; continue }
  const body = md.slice(bodyStart, fenceEnd + 1)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, body)
  console.log(`escrito  ${target}  (${body.split('\n').length - 1} lineas)`)
}
