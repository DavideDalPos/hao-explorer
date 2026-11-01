<template>
  <div class="rtl">
    <div class="rtl-legend">
      <span
        v-for="l in LANES"
        :key="l.key"
      ><i :style="{ background: l.color }" />{{ l.label }}</span>
      <span class="muted">Dot size: number of terms that cite the work</span>
    </div>

    <div
      ref="scroller"
      class="rtl-scroll"
    >
      <svg
        class="rtl-svg"
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="Timeline of the references cited in the ontology, by year and body region. The list below has the same works."
        @mouseleave="hover = null"
      >
        <!-- lanes -->
        <g
          v-for="(l, i) in LANES"
          :key="l.key"
        >
          <line
            class="rtl-lane"
            :x1="PAD_L"
            :x2="W - PAD_R"
            :y1="laneY(i)"
            :y2="laneY(i)"
          />
          <text
            class="rtl-lane-label"
            :x="PAD_L - 14"
            :y="laneY(i)"
            dy="0.32em"
            text-anchor="end"
          >{{ l.label }}</text>
        </g>
        <!-- years -->
        <g
          v-for="y in ticks"
          :key="y"
        >
          <line
            class="rtl-tick"
            :x1="x(y)"
            :x2="x(y)"
            :y1="TOP - 8"
            :y2="H - 26"
          />
          <text
            class="rtl-year"
            :x="x(y)"
            :y="H - 8"
            text-anchor="middle"
          >{{ y }}</text>
        </g>
        <!-- connections of the work under the pointer -->
        <g class="rtl-links">
          <path
            v-for="c in links"
            :key="c.key"
            :d="c.d"
            :style="{ strokeWidth: c.w }"
          />
        </g>
        <!-- works -->
        <circle
          v-for="d in dots"
          :key="d.key"
          :cx="d.x"
          :cy="d.y"
          :r="d.r"
          :class="['rtl-dot', { dim: hover && !near.has(d.key) && hover.key !== d.key, on: hover?.key === d.key }]"
          :style="{ '--c': d.color }"
          @mouseenter="hover = d"
          @click="open(d)"
        ><title>{{ d.short }} — cited by {{ d.n }} {{ d.n === 1 ? 'term' : 'terms' }}</title></circle>
      </svg>
    </div>

    <div
      class="rtl-panel"
      aria-live="polite"
    >
      <template v-if="hover">
        <div class="rtl-panel-head">
          <b>{{ hover.short }}</b>
          <RouterLink :to="refPath(hover.key)">Reference page →</RouterLink>
        </div>
        <p
          class="rtl-cite"
          v-html="hover.html"
        />
        <p class="muted rtl-meta">
          Cited by {{ hover.n }} {{ hover.n === 1 ? 'term' : 'terms' }} · shares terms with
          {{ near.size }} other {{ near.size === 1 ? 'work' : 'works' }}<template v-if="topNear.length">, most with
            <RouterLink
              v-for="(m, i) in topNear"
              :key="m.key"
              :to="refPath(m.key)"
            >{{ i ? ', ' : '' }}{{ m.short }} ({{ m.shared }})</RouterLink></template>
        </p>
      </template>
      <p
        v-else
        class="muted rtl-meta"
      >
        Each dot is a work cited in the ontology, placed by year and by the body region its terms belong to.
        Point at a dot to see the works that name the same parts; click it to open the reference.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { anatomyTree, BRANCHES } from '../lib/anatomyTree.js'
import { citedBy, citeHtml, hao, refPath, refShort } from '../lib/hao.js'

const router = useRouter()
const LANES = [
  { key: BRANCHES[0], label: 'head', color: 'var(--map-2)' },
  { key: BRANCHES[1], label: 'mesosoma', color: 'var(--map-1)' },
  { key: BRANCHES[2], label: 'abdomen', color: 'var(--map-3)' },
  { key: 'general', label: 'general', color: 'var(--muted)' }
]
const W = 1180, PAD_L = 92, PAD_R = 24, TOP = 26, LANE_H = 92
const H = TOP + LANES.length * LANE_H + 34
const Y0 = 1815, Y1 = 2026
const x = (y) => PAD_L + ((y - Y0) / (Y1 - Y0)) * (W - PAD_L - PAD_R)
const laneY = (i) => TOP + LANE_H * i + LANE_H / 2
const ticks = [1820, 1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025]

// which body region each term belongs to (from the same tree as the map)
const branchOf = {}
for (const b of anatomyTree().children) {
  const walk = (n) => { branchOf[n.id] = b.id; n.children.forEach(walk) }
  walk(b)
}

// works cited in the ontology, with year, region and the terms that cite them
const works = Object.entries(hao.value.refs)
  .map(([key, r]) => {
    const uses = citedBy(key)
    const terms = new Set(uses.map((u) => u.id))
    const m = r.t.match(/\b(1[789]\d\d|20[0-2]\d)\b/)
    if (!terms.size || !m) return null
    const tally = {}
    for (const t of terms) { const b = branchOf[t] || 'general'; tally[b] = (tally[b] || 0) + 1 }
    const lane = LANES.findIndex((l) => l.key === Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0])
    return { key, year: +m[1], terms, n: terms.size, lane, short: refShort(key), html: citeHtml(r) }
  })
  .filter(Boolean)

// term -> works citing it, to find the connections of a work
const worksOf = {}
for (const w of works) for (const t of w.terms) (worksOf[t] ||= []).push(w)

// place the dots: x by year, stacked up and down from the lane line so they do not overlap
const rad = (n) => 2.6 + Math.sqrt(n) * 1.5
const dots = (() => {
  const placed = LANES.map(() => [])
  const out = []
  for (const w of [...works].sort((a, b) => b.n - a.n)) {
    const r = Math.min(rad(w.n), 14), cx = x(w.year), base = laneY(w.lane)
    // try positions moving away from the lane line; stay inside the lane (overlap only when it is full)
    const room = LANE_H / 2 - r - 2
    let y = base
    for (let k = 0; k < 80; k++) {
      const t = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2.6
      if (Math.abs(t - base) > room) continue
      y = t
      if (!placed[w.lane].some((p) => (p.x - cx) ** 2 + (p.y - y) ** 2 < (p.r + r + 1) ** 2)) break
    }
    const d = { ...w, x: cx, y, r, color: LANES[w.lane].color }
    placed[w.lane].push(d)
    out.push(d)
  }
  return out.sort((a, b) => b.r - a.r) // small dots drawn last, on top
})()
const byKey = Object.fromEntries(dots.map((d) => [d.key, d]))

const hover = shallowRef(null)
const shared = computed(() => {
  const m = new Map()
  if (!hover.value) return m
  for (const t of hover.value.terms) for (const w of worksOf[t]) if (w.key !== hover.value.key) m.set(w.key, (m.get(w.key) || 0) + 1)
  return m
})
const near = computed(() => new Set(shared.value.keys()))
const links = computed(() => {
  const a = hover.value
  if (!a) return []
  return [...shared.value].map(([k, s]) => {
    const b = byKey[k]
    const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 30 - Math.abs(a.x - b.x) * 0.12
    return { key: k, d: `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`, w: Math.min(4, 0.8 + s * 0.5) }
  })
})
const topNear = computed(() =>
  [...shared.value].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key, s]) => ({ key, shared: s, short: byKey[key].short }))
)
const open = (d) => router.push(refPath(d.key))
</script>
