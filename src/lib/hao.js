// The ontology data (built by scripts/build-data.mjs) and helpers to read it.
import { shallowRef } from 'vue'

export const hao = shallowRef(null) // { version, terms, refs, relations }
let incoming = {}
let searchIndex = []

export async function loadHao() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/hao.json`)
  if (!res.ok) throw new Error('The ontology data is missing. Run `npm run data`.')
  const data = await res.json()
  incoming = {}
  searchIndex = []
  for (const [id, t] of Object.entries(data.terms)) {
    for (const [r, target] of t.r || []) (incoming[target] ||= []).push([r, id])
    if (t.o) continue
    searchIndex.push([id, t.n.toLowerCase(), t.n, null])
    for (const s of t.s || []) searchIndex.push([id, s[0].toLowerCase(), t.n, s[0]])
  }
  hao.value = data
}

export const term = (id) => hao.value?.terms[id]
export const termName = (id) => term(id)?.n || id
export const incomingOf = (id) => incoming[id] || []
export const relationName = (r) => (r === 'isa' ? 'is a' : hao.value?.relations[r] || r)

// IDs in links use an underscore: #/term/HAO_0000575
export const toSlug = (id) => id.replace(':', '_')
export const fromSlug = (s) => s.replace('_', ':')
export const termPath = (id) => `/term/${toSlug(id)}`
export const purl = (id) => `http://purl.obolibrary.org/obo/${toSlug(id)}`
export const olsUrl = (id) => `https://www.ebi.ac.uk/ols4/ontologies/hao/classes?iri=${encodeURIComponent(purl(id))}`

// Search terms and synonyms: exact, then starts with, then word inside, then anywhere
export function search(query, limit = 30) {
  const s = query.trim().toLowerCase()
  if (s.length < 2) return []
  const best = new Map()
  for (const [id, key, label, synonym] of searchIndex) {
    let score = key === s ? 0 : key.startsWith(s) ? 1 : key.includes(' ' + s) ? 2 : key.includes(s) ? 3 : -1
    if (score < 0) continue
    if (id.startsWith('HAO:')) score -= 0.1 // Hymenoptera-specific terms first
    if (synonym) score += 0.5
    const prev = best.get(id)
    if (!prev || score < prev.score) best.set(id, { id, label, synonym, score })
  }
  return [...best.values()].sort((a, b) => a.score - b.score || a.label.length - b.label.length).slice(0, limit)
}

// "Vilhelmsen, L. B., I. Miko, and L. Krogmann. 2010. …" -> "Vilhelmsen et al. 2010"
export function shortRef(full) {
  const m = full.match(/^(.*?)[.,]?\s*\(?((?:17|18|19|20)\d\d[a-z]?)\)?(?:[.,:]|\s)/)
  if (!m) return full.slice(0, 40) + '…'
  const head = m[1]
  const first = head.split(',')[0].trim().replace(/\s+[A-Z]{1,3}$/, '')
  const tail = head.slice(head.indexOf(',') + 1)
  const others = head.includes(',')
    ? tail.split(/,|\band\b|&/).map((x) => x.trim()).filter((x) => /[A-Za-zÀ-ž'-]{2,}(?!\.)\b/.test(x.replace(/\b[A-Z]\./g, '')))
    : []
  const last = (x) => x.replace(/\b[A-Z]\.\s*/g, '').trim().split(/\s+/).pop()
  const who = others.length > 1 ? `${first} et al.` : others.length === 1 ? `${first} & ${last(others[0])}` : first
  return `${who} ${m[2]}`
}

// Walk up "part of" (or "is a" when there is none) for the breadcrumb
export function lineage(id) {
  const chain = []
  let cur = id
  for (let guard = 0; guard < 12; guard++) {
    const t = term(cur)
    if (!t) break
    const partOf = (t.r || []).find((r) => r[0] === 'BFO:0000050')
    const next = partOf ? partOf[1] : (t.i || [])[0]
    if (!next || chain.includes(next) || !term(next)) break
    chain.unshift(next)
    cur = next
  }
  return chain
}
