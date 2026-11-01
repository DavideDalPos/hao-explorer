// The body as one tree, for the map on the start page: each current term hangs under the part it is
// "part of" (or, when it has none, under its "is a" parent). The three tagmata are the main branches.
import { hao } from './hao.js'

export const BRANCHES = ['HAO:0000397', 'HAO:0000576', 'HAO:0000015'] // head, mesosoma, abdomen

let cached = null

export function anatomyTree() {
  if (cached) return cached
  const terms = hao.value.terms
  const kids = {}
  for (const [id, t] of Object.entries(terms)) {
    if (t.o) continue
    const partOf = (t.r || []).find(([r, x]) => r === 'BFO:0000050' && terms[x] && !terms[x].o)
    const parent = partOf ? partOf[1] : (t.i || []).find((x) => terms[x] && !terms[x].o)
    if (parent) (kids[parent] ||= []).push(id)
  }
  const seen = new Set()
  const node = (id, name) => {
    seen.add(id)
    const children = (kids[id] || []).filter((c) => !seen.has(c)).map((c) => node(c))
    children.sort((a, b) => a.name.localeCompare(b.name))
    return { id, name: name || terms[id].n, children }
  }
  cached = { id: null, name: 'adult body', children: BRANCHES.map((id) => node(id)) }
  return cached
}
