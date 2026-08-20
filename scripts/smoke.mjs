// Smoke test contra la app desplegada. Prueba que las tres capas están vivas
// en el mismo origen: pantalla, middleware de sesión y ruta de API.
//
//   node scripts/smoke.mjs https://tu-app.vercel.app
//   node scripts/smoke.mjs                      # contra http://localhost:3000
//
// Falla con código 1 si alguna capa no responde, así que sirve como último
// paso del pipeline: merge -> test -> build -> deploy -> smoke.
const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')

const checks = [
  ['la portada responde', 'GET', '/', {}, r => r.status === 200],
  ['/capture pide sesión', 'GET', '/capture', { redirect: 'manual' }, r => [302, 307].includes(r.status)],
  ['/api/image rechaza al anónimo', 'POST', '/api/image', {
    headers: { 'content-type': 'application/json' }, body: '{}',
  }, r => r.status === 401],
]

let failed = 0
for (const [name, method, path, init, ok] of checks) {
  let line
  try {
    const res = await fetch(base + path, { method, ...init })
    line = ok(res) ? `  ok   ${name} (${res.status})` : `  FALLA ${name} — recibí ${res.status}`
    if (!ok(res)) failed++
  } catch (err) {
    line = `  FALLA ${name} — ${err.message}`
    failed++
  }
  console.log(line)
}

console.log(failed ? `\nsmoke ROJO contra ${base}` : `\nsmoke verde contra ${base}`)
process.exit(failed ? 1 : 0)
