// The releases of the ontology, for the Releases page: what each GitHub release of hao2 changed compared with
// the one before. Used by build-data.mjs.
//
// Releases are the GitHub releases of the hao2 repository (tag v2026-11-01, title "HAO 2.1.0 (2026-11-01)",
// notes). For each, hao.obo is read as it was at that tag, and compared with the previous release.
// config.releases.baseline is the release before the first GitHub release (HAO 2.0.0, 2026-02-12), used only
// as the starting point for the comparison.
// Release files never change, so each one is downloaded once and kept in .cache/releases/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const raw = (repo, ref, file) => `https://raw.githubusercontent.com/${repo}/${ref}/${file}`

export async function readReleases(config, root) {
  const { repo, baseline } = config.releases || {}
  if (!repo) return []
  let list
  try {
    const headers = { Accept: 'application/vnd.github+json' }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    list = (await res.json()).filter((r) => !r.draft)
  } catch (e) {
    console.warn(`Releases: could not read the GitHub releases of ${repo} (${e.message}); the Releases page will be empty`)
    return []
  }

  // oldest first, starting from the baseline
  const steps = list
    .map((r) => ({
      tag: r.tag_name,
      name: (r.name || r.tag_name).replace(/\s*\(\d{4}-\d\d-\d\d\)\s*$/, ''),
      notes: (r.body || '').trim(),
      published: r.published_at?.slice(0, 10),
      url: r.html_url
    }))
    .sort((a, b) => (a.published < b.published ? -1 : 1))
  if (baseline) steps.unshift({ tag: baseline.ref, name: baseline.name, notes: baseline.notes || '', published: baseline.date, baseline: true })

  const cacheDir = resolve(root, '.cache/releases')
  mkdirSync(cacheDir, { recursive: true })
  const out = []
  let prev = null
  for (const step of steps) {
    let text
    try {
      text = await readCached(cacheDir, step.tag, raw(repo, step.tag, 'hao.obo'))
    } catch (e) {
      console.warn(`Releases: could not read hao.obo of ${step.tag} (${e.message})`)
      continue
    }
    const cur = summarize(text)
    const entry = {
      tag: step.tag,
      name: step.name,
      version: cur.version,
      published: step.published,
      notes: step.notes,
      url: step.url,
      files: { obo: raw(repo, step.tag, 'hao.obo'), owl: raw(repo, step.tag, 'hao.owl') },
      terms: [...cur.terms.values()].filter((t) => !t.o).length,
      synonyms: [...cur.terms.values()].filter((t) => !t.o).reduce((n, t) => n + t.syn.size, 0),
      twSources: new Set([...cur.terms.values()].flatMap((t) => [...t.tw.keys()])).size
    }
    if (step.baseline) entry.baseline = true
    if (prev) entry.diff = compare(prev, cur)
    out.push(entry)
    prev = cur
  }
  console.log(`Releases: ${out.filter((r) => !r.baseline).length} on GitHub (${out.map((r) => r.name).join(', ')})`)
  return out.reverse() // newest first
}

async function readCached(dir, tag, url) {
  const f = resolve(dir, tag.replace(/[^\w.-]/g, '_') + '.obo')
  if (existsSync(f)) return readFileSync(f, 'utf8')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(f, text)
  return text
}

// per term: name, obsolete, definition, synonyms, and the TaxonWorks sources it cites
function summarize(text) {
  const version = (text.match(/^data-version: (.*)$/m) || [])[1]?.replace('releases/', '') || ''
  const terms = new Map()
  for (const s of text.split(/\r?\n\r?\n/)) {
    if (!s.startsWith('[Term]')) continue
    const id = (s.match(/^id: (\S+)/m) || [])[1]
    if (!id) continue
    const t = { n: (s.match(/^name: (.*?)(?: \{.*)?$/m) || [])[1] || id, syn: new Set(), tw: new Map() }
    if (/^is_obsolete: true/m.test(s)) t.o = true
    const def = s.match(/^def: "((?:[^"\\]|\\.)*)"/m)
    if (def) t.d = def[1]
    for (const m of s.matchAll(/^(?:synonym: |property_value: oboInOwl:has\w*Synonym )"((?:[^"\\]|\\.)*)"/gm)) t.syn.add(m[1])
    t.syn.delete(t.n) // a name repeated as its own synonym is not counted
    for (const m of s.matchAll(/\/api\/v1\/sources\/(\d+)/g)) t.tw.set(m[1], (t.tw.get(m[1]) || 0) + 1)
    terms.set(id, t)
  }
  return { version, terms }
}

function compare(a, b) {
  const d = { added: [], obsoleted: [], renamed: [], definitions: [], synonymsAdded: [], synonymsRemoved: [], references: [] }
  const twBefore = new Map(), twAfter = new Map()
  for (const [, t] of a.terms) for (const [s, n] of t.tw) twBefore.set(s, (twBefore.get(s) || 0) + n)
  for (const [id, t] of b.terms) {
    for (const [s, n] of t.tw) twAfter.set(s, (twAfter.get(s) || 0) + n)
    const p = a.terms.get(id)
    if (!p) { if (!t.o) d.added.push(id); continue }
    if (t.o && !p.o) { d.obsoleted.push(id); continue }
    if (t.o) continue
    if (p.n !== t.n) d.renamed.push([id, p.n])
    if ((p.d || '') !== (t.d || '')) d.definitions.push(id)
    for (const s of t.syn) if (!p.syn.has(s)) d.synonymsAdded.push([id, s])
    for (const s of p.syn) if (!t.syn.has(s)) d.synonymsRemoved.push([id, s])
  }
  // TaxonWorks sources cited in this release that were not cited before (references moved or newly added)
  for (const [s, n] of twAfter) if (!twBefore.has(s)) d.references.push(['tw' + s, n])
  for (const k of Object.keys(d)) if (!d[k].length) delete d[k]
  return d
}
