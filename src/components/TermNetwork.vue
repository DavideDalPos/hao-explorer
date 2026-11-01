<template>
  <div class="card">
    <div class="netbar">
      <div class="legend">
        <label
          v-for="(f, key) in FAMILY"
          :key="key"
        >
          <input
            v-model="shown"
            type="checkbox"
            :value="key"
          />
          <i :style="{ background: f.color }" />{{ f.label }}
        </label>
      </div>
      <div
        class="seg"
        role="group"
        aria-label="How far to look"
      >
        <button
          type="button"
          :aria-pressed="depth === 1"
          @click="depth = 1"
        >Direct</button>
        <button
          type="button"
          :aria-pressed="depth === 2"
          @click="depth = 2"
        >Two steps</button>
      </div>
    </div>
    <div
      ref="box"
      id="net"
      role="img"
      :aria-label="`Network of the terms connected to ${termName(id)}`"
    />
    <p class="nethint">Click a term to open it. Hover to see a relation or a hidden name. Drag to rearrange, scroll to zoom.</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import cytoscape from 'cytoscape'
import { incomingOf, relationName, term, termName, termPath } from '../lib/hao.js'
import { theme } from '../lib/theme.js'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const box = ref(null)
const depth = ref(1)

// relations grouped into families, each with its own line style
const FAMILY = {
  isa: { label: 'is a', color: '#8a94a6', dash: 'dashed' },
  part: { label: 'part of', color: '#d58a1c', dash: 'solid' },
  contact: { label: 'attached, continuous or adjacent', color: '#2f7fc1', dash: 'solid' },
  position: { label: 'position', color: '#2a9d8f', dash: 'dotted' },
  other: { label: 'other', color: '#9b6bc2', dash: 'solid' }
}
const shown = ref(Object.keys(FAMILY))
function family(r) {
  if (r === 'isa') return 'isa'
  if (r === 'BFO:0000050' || r === 'BFO:0000051') return 'part'
  if (/^(RO:0002371|RO:0002150|RO:0002220|AISM:0000078|AISM:0000079|RO:0002008)$/.test(r) || /connected_to/.test(r)) return 'contact'
  if (/^BSPO:/.test(r) || /^AISM:00000(11|12)$/.test(r) || r === 'parallel_to') return 'position'
  return 'other'
}

function elements(id, steps) {
  const nodes = new Map()
  const edges = new Map()
  const addNode = (n, level) => { if (!nodes.has(n) || nodes.get(n) > level) nodes.set(n, level) }
  const expand = (n, cap) => {
    const t = term(n)
    if (!t) return []
    const found = []
    const push = (a, r, b, other) => {
      const f = family(r)
      if (found.length >= cap || !shown.value.includes(f) || !term(other) || term(other).o) return
      edges.set(`${a}|${r}|${b}`, { a, r, b, f })
      found.push(other)
    }
    for (const p of t.i || []) push(n, 'isa', p, p)
    for (const [r, target] of t.r || []) push(n, r, target, target)
    for (const [r, source] of incomingOf(n)) push(source, r, n, source)
    for (const k of (t.k || []).slice(0, 12)) push(k, 'isa', n, k)
    return found
  }
  addNode(id, 0)
  const first = expand(id, 60)
  first.forEach((n) => addNode(n, 1))
  if (steps > 1) for (const n of first) expand(n, 8).forEach((m) => { if (nodes.size < 140) addNode(m, 2) })
  const els = [...nodes].map(([n, level]) => ({ data: { id: n, label: termName(n), level } }))
  for (const e of edges.values()) {
    if (nodes.has(e.a) && nodes.has(e.b)) els.push({ data: { id: `${e.a}|${e.r}|${e.b}`, source: e.a, target: e.b, fam: e.f, label: relationName(e.r) } })
  }
  return els
}

let cy = null
function draw() {
  if (!box.value) return
  const css = getComputedStyle(document.documentElement)
  const v = (name) => css.getPropertyValue(name).trim()
  cy?.destroy()
  cy = cytoscape({
    container: box.value,
    elements: elements(props.id, depth.value),
    wheelSensitivity: 0.25,
    style: [
      { selector: 'node', style: { label: 'data(label)', 'font-family': 'IBM Plex Sans, sans-serif', 'font-size': 11, color: v('--ink'), 'text-wrap': 'wrap', 'text-max-width': 110, 'text-valign': 'bottom', 'text-margin-y': 4, width: 12, height: 12, 'background-color': v('--surface'), 'border-width': 2, 'border-color': v('--muted') } },
      { selector: 'node[level = 2]', style: { width: 8, height: 8, 'font-size': 9, color: v('--muted'), 'text-opacity': 0 } },
      { selector: 'node[level = 2].hover', style: { 'text-opacity': 1 } },
      { selector: 'node[level = 0]', style: { width: 26, height: 26, 'background-color': v('--accent'), 'border-color': v('--accent'), 'font-size': 14, 'font-weight': 600 } },
      { selector: 'node:active', style: { 'overlay-opacity': 0 } },
      ...Object.entries(FAMILY).map(([k, f]) => ({ selector: `edge[fam = "${k}"]`, style: { 'line-color': f.color, 'target-arrow-color': f.color, 'line-style': f.dash } })),
      { selector: 'edge', style: { width: 1.6, 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.8, opacity: 0.85 } },
      { selector: 'edge.hover', style: { label: 'data(label)', 'font-size': 10, color: v('--ink'), 'text-background-color': v('--surface'), 'text-background-opacity': 1, 'text-background-padding': 2, width: 3 } },
      { selector: 'node.hover', style: { 'border-color': v('--accent'), 'border-width': 3 } }
    ],
    layout: depth.value === 1
      ? { name: 'concentric', concentric: (n) => 3 - n.data('level'), levelWidth: () => 1, minNodeSpacing: 30, animate: false }
      : { name: 'cose', animate: false, nodeRepulsion: () => 40000, idealEdgeLength: (e) => (e.source().data('level') + e.target().data('level') > 1 ? 60 : 130), nodeOverlap: 20, randomize: false, numIter: 2500 }
  })
  cy.on('mouseover', 'node', (e) => { e.target.addClass('hover'); e.target.connectedEdges().addClass('hover'); box.value.style.cursor = 'pointer' })
  cy.on('mouseout', 'node', (e) => { e.target.removeClass('hover'); e.target.connectedEdges().removeClass('hover'); box.value.style.cursor = '' })
  cy.on('mouseover', 'edge', (e) => e.target.addClass('hover'))
  cy.on('mouseout', 'edge', (e) => e.target.removeClass('hover'))
  cy.on('tap', 'node', (e) => { if (e.target.id() !== props.id) router.push(termPath(e.target.id())) })
}

onMounted(draw)
watch([() => props.id, depth, shown, theme], draw)
onBeforeUnmount(() => cy?.destroy())
</script>
