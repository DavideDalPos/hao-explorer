<template>
  <div class="omap">
    <nav
      class="omap-trail"
      aria-label="Where you are in the map"
    >
      <button
        v-for="(n, i) in trail"
        :key="n.data.id || 'root'"
        type="button"
        :aria-current="i === trail.length - 1 ? 'location' : undefined"
        @click="zoom(n)"
      >{{ n.data.name }}</button>
    </nav>

    <div class="omap-stage">
      <svg
        class="omap-svg"
        :viewBox="`${-R} ${-R} ${2 * R} ${2 * R}`"
        role="img"
        :aria-label="`Map of the parts of the ${focus.data.name}`"
        @mouseleave="hover = null"
      >
        <g>
          <path
            v-for="a in arcs"
            :key="a.key"
            :d="a.d"
            :class="['arc', { dim: hover && !a.lit }]"
            :style="{ '--c': a.color, '--mix': a.mix }"
            @mouseenter="hover = a.node"
            @click="a.node.children ? zoom(a.node) : open(a.node)"
          ><title>{{ a.node.data.name }}{{ a.node.children ? ` — ${a.node.value - 1} parts` : '' }}</title></path>
        </g>
        <g
          class="omap-labels"
          aria-hidden="true"
        >
          <text
            v-for="l in labels"
            :key="l.key"
            :transform="l.transform"
            :class="{ light: l.light }"
            dy="0.32em"
          >{{ l.text }}</text>
        </g>
        <circle
          class="omap-center"
          :r="ring - 2"
          @click="focus.parent && zoom(focus.parent)"
          @mouseenter="hover = null"
        ><title>{{ focus.parent ? `Back to ${focus.parent.data.name}` : focus.data.name }}</title></circle>
        <text
          class="omap-center-name"
          text-anchor="middle"
          :y="focus.parent ? -10 : -4"
        >{{ focus.data.name }}</text>
        <text
          class="omap-center-count"
          text-anchor="middle"
          :y="focus.parent ? 14 : 20"
        >{{ nf(focus.value - 1) }} parts</text>
        <text
          v-if="focus.parent"
          class="omap-center-back"
          text-anchor="middle"
          y="36"
        >↑ back</text>
      </svg>
    </div>

    <aside class="omap-panel">
      <div
        class="omap-swatch"
        :style="{ '--c': colorOf(shown) }"
      />
      <h2>{{ shown.data.name }}</h2>
      <p
        v-if="shown.data.id"
        class="mono muted"
      >{{ shown.data.id }}</p>
      <p class="omap-def">{{ definition }}</p>
      <p class="omap-count">
        <b>{{ nf(shown.value - 1) }}</b> parts inside
        <template v-if="shown.children"> · {{ shown.children.length }} directly</template>
      </p>
      <div
        v-if="shown.children"
        class="omap-kids"
      >
        <button
          v-for="c in topKids"
          :key="c.data.id"
          type="button"
          class="chip"
          @click="c.children ? zoom(c) : open(c)"
        >{{ c.data.name }}<span
          v-if="c.children"
          class="muted"
        > {{ c.value - 1 }}</span></button>
      </div>
      <RouterLink
        v-if="shown.data.id"
        class="omap-open"
        :to="termPath(shown.data.id)"
      >Open “{{ shown.data.name }}” →</RouterLink>
      <p
        class="omap-hint muted"
      >Click a segment to zoom in, the centre to go back. Hover to read.</p>
    </aside>
  </div>
</template>

<script setup>
// Zoomable sunburst of the body: rings are levels of "part of", segment size is the number of parts inside
import { computed, onBeforeUnmount, shallowRef, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
import { hierarchy, partition } from 'd3-hierarchy'
import { arc as d3arc } from 'd3-shape'
import { term, termPath } from '../lib/hao.js'
import { anatomyTree } from '../lib/anatomyTree.js'

const router = useRouter()
const R = 300 // svg half-size
const RINGS = 3 // rings shown around the centre
const ring = R / (RINGS + 1)
const nf = (n) => n.toLocaleString('en-US')

// one hue per main branch (validated categorical slots 1-3), lighter toward the outside
const HUES = ['var(--map-1)', 'var(--map-2)', 'var(--map-3)']

const root = partition().size([2 * Math.PI, 1])(
  hierarchy(anatomyTree()).sum(() => 1).sort((a, b) => b.value - a.value)
)
// partition() gives y in [0,1]; use whole rings instead
for (const d of root.descendants()) {
  d.y0 = d.depth
  d.y1 = d.depth + 1
  d.branch = d.depth === 0 ? -1 : root.children.indexOf(d.ancestors().find((a) => a.depth === 1))
  d.cur = { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }
}

const focus = shallowRef(root)
const hover = shallowRef(null)
const tick = shallowRef(0)
const shown = computed(() => hover.value || focus.value)

const colorOf = (d) => (d.branch < 0 ? 'var(--muted)' : HUES[d.branch])
const path = d3arc()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.004))
  .padRadius(ring * 1.5)
  .innerRadius((d) => d.y0 * ring)
  .outerRadius((d) => Math.max(d.y0 * ring, d.y1 * ring - 2))

const visible = (c) => c.y1 <= RINGS + 1 && c.y0 >= 1 && c.x1 - c.x0 > 0.0015

const arcs = computed(() => {
  tick.value // redraw on every animation frame
  const lit = hover.value ? new Set(hover.value.ancestors().concat(hover.value.descendants())) : null
  const out = []
  for (const d of focus.value.descendants()) {
    if (!visible(d.cur)) continue
    out.push({
      key: d.data.id + '|' + d.depth,
      node: d,
      d: path(d.cur),
      color: colorOf(d),
      mix: `${Math.max(38, 100 - (d.cur.y0 - 1) * 22)}%`,
      lit: !lit || lit.has(d)
    })
  }
  return out
})

const labels = computed(() => {
  tick.value
  const out = []
  for (const d of focus.value.descendants()) {
    const c = d.cur
    if (!visible(c) || (c.x1 - c.x0) * (c.y0 + c.y1) * ring < 34) continue
    const max = Math.floor(ring / 6.6)
    const text = d.data.name.length > max ? d.data.name.slice(0, max - 1) + '…' : d.data.name
    const x = (((c.x0 + c.x1) / 2) * 180) / Math.PI
    const y = ((c.y0 + c.y1) / 2) * ring
    out.push({ key: d.data.id + '|' + d.depth, text, light: c.y0 < 1.5, transform: `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})` })
  }
  return out
})

let raf = 0
function zoom(p) {
  if (!p || p === focus.value) return
  hover.value = null
  const from = new Map(), to = new Map()
  for (const d of root.descendants()) {
    from.set(d, { ...d.cur })
    to.set(d, {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    })
  }
  // animate from the larger of the two subtrees so arcs leaving and entering are both drawn
  const keep = p.depth < focus.value.depth ? p : focus.value
  focus.value = keep
  const start = performance.now(), ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650
  cancelAnimationFrame(raf)
  const step = (now) => {
    const t = ms ? Math.min(1, (now - start) / ms) : 1
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    for (const d of root.descendants()) {
      const a = from.get(d), b = to.get(d)
      d.cur = { x0: a.x0 + (b.x0 - a.x0) * e, x1: a.x1 + (b.x1 - a.x1) * e, y0: a.y0 + (b.y0 - a.y0) * e, y1: a.y1 + (b.y1 - a.y1) * e }
    }
    triggerRef(tick)
    tick.value++
    if (t < 1) raf = requestAnimationFrame(step)
    else focus.value = p
  }
  raf = requestAnimationFrame(step)
}
onBeforeUnmount(() => cancelAnimationFrame(raf))

const open = (d) => d.data.id && router.push(termPath(d.data.id))
const trail = computed(() => focus.value.ancestors().reverse())
const topKids = computed(() => (shown.value.children || []).slice(0, 14))
const definition = computed(() => {
  const d = shown.value
  if (!d.data.id) return 'Every part of an adult wasp, bee, ant or sawfly in the ontology, grouped by the tagma it belongs to: head, mesosoma and abdomen.'
  const def = term(d.data.id)?.d || 'No definition yet.'
  return def.length > 260 ? def.slice(0, 257) + '…' : def
})
</script>
