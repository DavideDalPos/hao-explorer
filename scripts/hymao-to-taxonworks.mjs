// Replaces the old HAO bibliography addresses in the ontology with TaxonWorks source addresses.
//
//   npm run references            shows what would change
//   npm run references:update     changes the file
// (the file is ontologyEdit in explorer.config.json; the steps are in UPDATING-REFERENCES.md)
//
// It asks the HAO project in TaxonWorks which sources carry an old address as a URI identifier
// (e.g. http://api.hymao.org/api/ref/68598 on source 44001), then replaces, in the ontology,
//   "http://api.hymao.org/api/ref/68598"  ->  "https://sfg.taxonworks.org/api/v1/sources/44001"
// Only linked references are replaced; the others stay as they are and are listed in the report.
// The old number is not lost: it stays on the TaxonWorks source as its identifier.
//
// It also writes hymao-to-taxonworks-report.csv in this folder (not committed): every old reference, its
// TaxonWorks source (if linked), and how many times the ontology cites it.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(resolve(root, 'explorer.config.json'), 'utf8'))
const { api, project_token: token } = config.taxonworks

// the ontology file: given on the command line, or ontologyEdit in explorer.config.json
const arg = process.argv.slice(2).find((a) => !a.startsWith('--'))
const file = arg ? resolve(arg) : resolve(root, config.ontologyEdit || '')
const write = process.argv.includes('--write')
if (!existsSync(file) || !file.endsWith('.owl')) {
  console.log(`Cannot find the ontology file: ${file}
Set "ontologyEdit" in explorer.config.json, or give the path: npm run references -- <path to hao-edit.owl>`)
  process.exit(1)
}

// 1. the HAO project's sources and their old addresses
const map = new Map() // old number -> TaxonWorks source id
const problems = []
for (let page = 1, pages = 1; page <= pages; page++) {
  const res = await fetch(`${api}/sources?in_project=true&per=500&page=${page}&extend[]=identifiers&project_token=${token}`)
  if (!res.ok) throw new Error(`TaxonWorks did not answer (HTTP ${res.status})`)
  pages = Number(res.headers.get('pagination-total-pages')) || 1
  for (const s of await res.json()) {
    for (const i of s.identifiers || []) {
      const n = (i.value.match(/hymao\.org\/api\/ref\/(\d+)\s*$/) || [])[1]
      if (i.type !== 'Identifier::Global::Uri' || !n) continue
      if (map.has(n) && map.get(n) !== s.id) problems.push(`hymao ${n} is on two TaxonWorks sources: ${map.get(n)} and ${s.id} (left unchanged)`)
      else map.set(n, s.id)
    }
  }
}
for (const p of problems) map.delete(p.match(/hymao (\d+)/)[1])

// 2. the ontology
const text = readFileSync(file, 'utf8')
const counts = new Map()
for (const m of text.matchAll(/"http:\/\/api\.hymao\.org\/api\/ref\/(\d+)"/g)) counts.set(m[1], (counts.get(m[1]) || 0) + 1)

let replaced = 0
const out = text.replace(/"http:\/\/api\.hymao\.org\/api\/ref\/(\d+)"/g, (all, n) => {
  if (!map.has(n)) return all
  replaced++
  return `"${api}/sources/${map.get(n)}"`
})

// 3. report
const linked = [...counts.keys()].filter((n) => map.has(n))
const notCited = [...map.keys()].filter((n) => !counts.has(n))
const rows = [['hymao_number', 'old_address', 'taxonworks_source', 'new_address', 'times_cited']]
for (const [n, c] of [...counts].sort((a, b) => b[1] - a[1])) {
  const id = map.get(n)
  rows.push([n, `http://api.hymao.org/api/ref/${n}`, id || '', id ? `${api}/sources/${id}` : '', c])
}
const report = resolve(root, 'hymao-to-taxonworks-report.csv')
writeFileSync(report, rows.map((r) => r.join(',')).join('\n') + '\n')

console.log(`
Ontology: ${file}
  old references cited:         ${counts.size} (${[...counts.values()].reduce((a, b) => a + b, 0)} citations)
  linked in TaxonWorks:         ${linked.length} references -> ${replaced} citations ${write ? 'REPLACED' : 'would be replaced'}
  not linked yet (unchanged):   ${counts.size - linked.length}
  report:                       ${report}`)
if (notCited.length) console.log(`  linked in TaxonWorks but not in this file: ${notCited.join(', ')} (already replaced, or not cited)`)
for (const p of problems) console.log(`  ! ${p}`)

if (write) {
  writeFileSync(file, out)
  console.log('\nThe ontology file was changed. Next: make the release and push hao2 (see UPDATING-REFERENCES.md).\n')
} else {
  console.log('\nNothing was changed. To change the file: npm run references:update\n')
}
