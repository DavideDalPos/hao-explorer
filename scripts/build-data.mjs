// Turns the HAO release (hao.obo) into the data the site uses: public/data/hao.json.
//
//   npm run data        (also run automatically by `npm run dev` and `npm run build`)
//
// Where the ontology comes from: explorer.config.json lists local paths to try
// (e.g. ../hao.obo when this folder sits inside the hao2 repository); if none
// exists, the release is downloaded from ontologyUrl.
//
// References: the ontology points to the old HAO bibliography by number
// (http://api.hymao.org/api/ref/67864). data/hymao-refs.json holds the old
// citations for those numbers. The sources of the HAO project in TaxonWorks
// replace them: a TaxonWorks source that carries the old address as a URI
// identifier is shown instead of the old citation, and sources not cited in
// the ontology yet are listed too.
//
// TaxonWorks is read with the HAO project token in explorer.config.json (a public,
// read-only token, as in TaxonPages).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readReleases } from './releases.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(resolve(root, 'explorer.config.json'), 'utf8'))

async function readOntology() {
  for (const p of config.ontology) {
    const f = resolve(root, p)
    if (existsSync(f)) {
      console.log(`HAO: reading ${f}`)
      return readFileSync(f, 'utf8')
    }
  }
  console.log(`HAO: no local release found, downloading ${config.ontologyUrl}`)
  const res = await fetch(config.ontologyUrl)
  if (!res.ok) throw new Error(`Could not download the ontology (${res.status}). Put hao.obo in one of: ${config.ontology.join(', ')}`)
  return res.text()
}

// "value {a="b", c="d"}" -> [value, qualifiers]; braces inside quotes are ignored
function splitQualifiers(line) {
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '\\') { i++; continue }
    if (ch === '"') inQuote = !inQuote
    else if (!inQuote && ch === '{' && line[i - 1] === ' ') return [line.slice(0, i).trim(), line.slice(i + 1).replace(/}\s*$/, '')]
  }
  return [line.trim(), '']
}
const clean = (s) => s.replace(/\\n/g, '\n').replace(/\\"/g, '"')
function qualifiers(q) {
  const out = []
  for (const m of q.matchAll(/([\w:]+)="((?:[^"\\]|\\.)*)"/g)) out.push([m[1], clean(m[2])])
  return out
}
const unquote = (s) => {
  const m = s.match(/^"((?:[^"\\]|\\.)*)"/)
  return m ? clean(m[1]) : s
}
function sources(qs) {
  const refs = [], cites = []
  for (const [k, v] of qs) {
    // old HAO bibliography (…/api/ref/68598) or a TaxonWorks source (…/api/v1/sources/44001)
    const m = v.match(/hymao\.org\/api\/ref\/(\d+)/) || v.match(/\/api\/v1\/sources\/(\d+)/)
    if (/hasDbXref$/.test(k) && m) refs.push(m[0].includes('sources') ? 'tw' + m[1] : m[1])
    else if (k === 'AISM:0000171') cites.push(v.trim())
  }
  return { refs, cites }
}

const text = await readOntology()
const stanzas = text.split(/\r?\n\r?\n/)
const version = (text.match(/^data-version: (.*)$/m) || [])[1]?.replace('releases/', '') || ''

const relations = { parallel_to: 'parallel to', 'OBO_REL:0000004': 'related to' }
for (const s of stanzas) {
  if (!s.startsWith('[Typedef]')) continue
  const id = s.match(/^id: (\S+)/m)[1]
  const name = s.match(/^name: (.*)$/m)
  relations[id] = name ? splitQualifiers(name[1])[0].replace(/_/g, ' ') : id
}

const raw = {}
for (const s of stanzas) {
  if (!s.startsWith('[Term]')) continue
  const d = { syn: new Map(), isa: [], rel: [], notes: [], xref: [], by: new Set(), cites: [] }
  for (const line of s.split(/\r?\n/).slice(1)) {
    const i = line.indexOf(': ')
    if (i < 0) continue
    const tag = line.slice(0, i)
    const [value, q] = splitQualifiers(line.slice(i + 2))
    const qs = qualifiers(q)
    for (const [k, v] of qs) if (k === 'dc:contributor') d.by.add(v.split(/\s/)[0])
    const addSyn = (t, kind, src) => {
      if (!d.syn.has(t)) d.syn.set(t, { kind, refs: [], cites: [] })
      const e = d.syn.get(t)
      for (const r of src.refs) if (!e.refs.includes(r)) e.refs.push(r)
      for (const c of src.cites) if (!e.cites.includes(c)) e.cites.push(c)
    }
    switch (tag) {
      case 'id': d.id = value; break
      case 'name': d.name = value; d.cites.push(...sources(qs).cites); break
      case 'def': {
        const m = value.match(/^"((?:[^"\\]|\\.)*)"/)
        d.def = m ? clean(m[1]) : unquote(value)
        const src = sources(qs)
        d.defRefs = src.refs
        d.cites.push(...src.cites)
        break
      }
      case 'is_a': d.isa.push(value.split(' ')[0]); break
      case 'relationship': {
        const [r, target] = value.split(' ! ')[0].split(/\s+/)
        if (target) d.rel.push([r, target])
        break
      }
      case 'synonym': addSyn(unquote(value), 'exact', sources(qs)); break
      case 'property_value': {
        const sp = value.indexOf(' ')
        const prop = value.slice(0, sp), rest = value.slice(sp + 1)
        if (prop === 'oboInOwl:hasRelatedSynonym') addSyn(unquote(rest), 'related', sources(qs))
        else if (prop === 'IAO:0000118') addSyn(unquote(rest), 'alternative', { refs: [], cites: [] })
        else if (prop === 'IAO:0000232') d.notes.push(unquote(rest))
        else if (prop === 'foaf:depiction') (d.img ||= []).push(unquote(rest).split(/\s/)[0])
        break
      }
      case 'comment': d.notes.push(value); break
      case 'xref': {
        const m = value.match(/^(\S+)(?:\s+"(.*?)")?/)
        d.xref.push([m[1], m[2] || ''])
        break
      }
      case 'is_obsolete': if (value === 'true') d.obsolete = true; break
      case 'replaced_by': d.replacedBy = value; break
    }
  }
  if (d.id && d.name) raw[d.id] = d
}

// children and parts, computed from the other direction
const children = {}, parts = {}
for (const [id, d] of Object.entries(raw)) {
  for (const p of d.isa) (children[p] ||= []).push(id)
  for (const [r, t] of d.rel) if (r === 'BFO:0000050') (parts[t] ||= []).push(id)
}

const allRefs = JSON.parse(readFileSync(resolve(root, 'data/hymao-refs.json'), 'utf8'))
const usedRefs = new Set()
const terms = {}
for (const [id, d] of Object.entries(raw)) {
  const t = { n: d.name }
  if (d.obsolete) t.o = 1
  if (d.def) t.d = d.def
  if (d.defRefs?.length) { t.dr = d.defRefs; d.defRefs.forEach((r) => usedRefs.add(r)) }
  if (d.cites.length) t.c = [...new Set(d.cites)]
  const syn = [...d.syn].filter(([s]) => s !== d.name).sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }))
  if (syn.length) t.s = syn.map(([s, e]) => { e.refs.forEach((r) => usedRefs.add(r)); return [s, e.kind[0], e.refs, e.cites] })
  if (d.isa.length) t.i = d.isa
  if (d.rel.length) t.r = d.rel
  if (children[id]) t.k = children[id].sort()
  if (parts[id]) t.p = parts[id].sort()
  if (d.notes.length) t.x = d.notes
  if (d.xref.length) t.xr = d.xref
  if (d.img) t.img = d.img
  if (d.by.size) t.b = [...d.by].sort()
  if (d.replacedBy) t.rb = d.replacedBy
  terms[id] = t
}
// references, keyed by the old HAO number ("67810") or "tw44001" for a TaxonWorks source (cited in the ontology
// by its TaxonWorks address, or in the HAO project but not cited yet).
// Each: { t: plain citation, h: citation as HTML (TaxonWorks), tw, u: link, doi, hy: old number }
const refs = {}
for (const r of usedRefs) if (allRefs[r] && !/404/.test(allRefs[r])) refs[r] = { t: allRefs[r], hy: r }

const tw = await readTaxonWorks()
if (tw) {
  const add = (s) => {
    const html = s.cached
      .replace(/<(?!\/?i>)[^>]*>/g, '') // keep italics only
      // TaxonWorks writes the URI identifier into the citation ("Available at http://api.hymao.org/api/ref/68598");
      // that old address is shown separately on the reference page, so it is left out of the citation
      .replace(/\s*Available at https?:\/\/api\.hymao\.org\/api\/ref\/\d+\.?/g, '')
      .trim()
    const entry = { t: html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&'), h: html, tw: s.id }
    if (s.url) entry.u = s.url
    if (s.doi) entry.doi = s.doi
    const old = (s.identifiers || [])
      .filter((i) => i.type === 'Identifier::Global::Uri')
      .map((i) => (i.value.match(/hymao\.org\/api\/ref\/(\d+)/) || [])[1])
      .filter(Boolean)
    const cited = old.filter((n) => usedRefs.has(n))
    if (!cited.length || usedRefs.has('tw' + s.id)) refs['tw' + s.id] = old.length ? { ...entry, hy: old[0] } : entry
    for (const n of cited) refs[n] = { ...entry, hy: n }
  }
  tw.forEach(add)
  // sources cited by TaxonWorks address but not (or no longer) in the HAO project
  for (const k of usedRefs) {
    if (!k.startsWith('tw') || refs[k]) continue
    const s = await readTaxonWorksSource(k.slice(2))
    if (s) add(s)
  }
  const cited = [...usedRefs].filter((k) => refs[k])
  const linked = cited.filter((k) => refs[k].tw)
  const direct = cited.filter((k) => k.startsWith('tw'))
  console.log(`TaxonWorks: ${tw.length} sources in the HAO project; ${linked.length} of the ${cited.length} references cited in the ontology are in TaxonWorks (${direct.length} cited by their TaxonWorks address)`)
}

mkdirSync(resolve(root, 'public/data'), { recursive: true })
const taxonworks = tw ? { app: config.taxonworks.app, api: config.taxonworks.api, sources: tw.length } : null
const releases = await readReleases(config, root)
const release = releases.find((r) => r.version === version)?.name || ''
writeFileSync(resolve(root, 'public/data/hao.json'), JSON.stringify({ version, release, releases, terms, refs, relations, taxonworks }))
const current = Object.values(terms).filter((t) => !t.o)
console.log(`HAO ${version}: ${current.length} current terms, ${current.reduce((n, t) => n + (t.s?.length || 0), 0)} synonyms, ${Object.keys(refs).length} references → public/data/hao.json`)

// All sources of the HAO project, with their identifiers; null when there is no token or TaxonWorks does not answer
async function readTaxonWorks() {
  const token = process.env.TW_PROJECT_TOKEN || config.taxonworks.project_token
  if (!token) {
    console.warn('\n  ⚠  TaxonWorks NOT read: no project_token in explorer.config.json. References show the old HAO citations.\n')
    return null
  }
  const out = []
  try {
    for (let page = 1, pages = 1; page <= pages; page++) {
      const url = `${config.taxonworks.api}/sources?in_project=true&per=500&page=${page}&extend[]=identifiers&project_token=${encodeURIComponent(token)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      out.push(...(await res.json()))
      pages = Number(res.headers.get('pagination-total-pages')) || 1
    }
  } catch (e) {
    console.warn(`TaxonWorks: could not read the HAO project (${e.message}); using the old HAO citations only`)
    return null
  }
  return out
}

// One source by its TaxonWorks id (sources are shared by all projects); null if it cannot be read
async function readTaxonWorksSource(id) {
  const token = process.env.TW_PROJECT_TOKEN || config.taxonworks.project_token
  try {
    const res = await fetch(`${config.taxonworks.api}/sources/${id}?extend[]=identifiers&project_token=${encodeURIComponent(token)}`)
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
