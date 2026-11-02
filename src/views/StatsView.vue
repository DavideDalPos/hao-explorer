<template>
  <nav
    class="crumbs"
    aria-label="Where this page sits"
  >
    <RouterLink to="/">Home</RouterLink>
  </nav>
  <h1 class="page-title">Statistics</h1>
  <p class="lede">
    The ontology in numbers, for the current release ({{ hao.release || 'release' }}, {{ hao.version }}).
  </p>
  <div class="actions no-print">
    <button
      class="btn"
      type="button"
      @click="exportCsv"
    >Download these numbers (CSV)</button>
    <button
      class="btn"
      type="button"
      @click="print"
    >Print or save as PDF</button>
  </div>

  <div class="kpis">
    <div
      v-for="k in kpis"
      :key="k.label"
      class="kpi"
    >
      <b>{{ k.value }}</b>
      <span>{{ k.label }}</span>
      <small v-if="k.note">{{ k.note }}</small>
    </div>
  </div>

  <div class="stat-grid">
    <section class="card">
      <h3>Releases</h3>
      <table class="syn">
        <thead><tr><th>Release</th><th>Date</th><th class="num">Terms</th><th class="num">Synonyms</th><th class="num">Refs from TaxonWorks</th></tr></thead>
        <tbody>
          <tr
            v-for="r in releases"
            :key="r.tag"
          >
            <td><RouterLink to="/releases">{{ r.name }}</RouterLink></td>
            <td class="mono">{{ r.version }}</td>
            <td class="num">{{ nf(r.terms) }}</td>
            <td class="num">{{ r.synonyms != null ? nf(r.synonyms) : '—' }}</td>
            <td class="num">{{ r.twSources != null ? nf(r.twSources) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h3>Where the terms come from</h3>
      <div class="hbars">
        <div
          v-for="b in byPrefix"
          :key="b.label"
          class="hbar"
          :title="`${b.label}: ${nf(b.n)} terms`"
        >
          <span class="hbar-label">{{ b.label }}</span>
          <span class="hbar-track"><i :style="{ width: pct(b.n, byPrefix[0].n) }" /></span>
          <span class="hbar-val">{{ nf(b.n) }}</span>
        </div>
      </div>
    </section>

    <section class="card wide">
      <h3>References cited, by decade of publication</h3>
      <div
        class="cols"
        role="img"
        :aria-label="decades.map((d) => `${d.label}: ${d.n}`).join(', ')"
      >
        <div
          v-for="d in decades"
          :key="d.label"
          class="col"
          :title="`${d.label}s: ${d.n} ${d.n === 1 ? 'work' : 'works'}`"
        >
          <span class="col-val">{{ d.n || '' }}</span>
          <span class="col-bar"><i :style="{ height: pct(d.n, maxDecade) }" /></span>
          <span class="col-label">{{ d.label % 50 === 0 ? d.label : '' }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Kinds of synonyms</h3>
      <div class="hbars">
        <div
          v-for="b in synKinds"
          :key="b.label"
          class="hbar"
          :title="`${b.label}: ${nf(b.n)}`"
        >
          <span class="hbar-label">{{ b.label }}</span>
          <span class="hbar-track"><i :style="{ width: pct(b.n, Math.max(...synKinds.map((x) => x.n))) }" /></span>
          <span class="hbar-val">{{ nf(b.n) }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Groups covered</h3>
      <p
        v-if="!groups.length"
        class="muted"
        style="margin: 0"
      >None yet: groups come from citations on OTUs in TaxonWorks.</p>
      <table
        v-else
        class="syn"
      >
        <thead><tr><th>Group</th><th class="num">Works</th><th class="num">Names</th></tr></thead>
        <tbody>
          <tr
            v-for="g in groups"
            :key="g.key"
          >
            <td><RouterLink :to="groupPath(g.key)">{{ g.n }}</RouterLink></td>
            <td class="num">{{ g.works }}</td>
            <td class="num">{{ g.names }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { citedBy, csv, download, groupPath, hao, namesInGroup, worksOfGroup } from '../lib/hao.js'

const nf = (n) => n.toLocaleString('en-US')
const pct = (n, max) => `${max ? Math.max(1.5, (100 * n) / max) : 0}%`
const current = computed(() => Object.entries(hao.value.terms).filter(([, t]) => !t.o))
const releases = computed(() => hao.value.releases || [])

const cited = computed(() => Object.keys(hao.value.refs).filter((k) => citedBy(k).length))
const linked = computed(() => cited.value.filter((k) => hao.value.refs[k].tw).length)
const synonyms = computed(() => current.value.reduce((n, [, t]) => n + (t.s?.length || 0), 0))
const groups = computed(() =>
  Object.entries(hao.value.groups || {})
    .map(([key, g]) => ({ key, n: g.n, works: worksOfGroup(key).length, names: new Set(namesInGroup(key).map((x) => x.id + x.what)).size }))
    .sort((a, b) => b.works - a.works || a.n.localeCompare(b.n))
)

const kpis = computed(() => [
  { label: 'terms', value: nf(current.value.length), note: `${nf(current.value.filter(([id]) => id.startsWith('HAO:')).length)} specific to Hymenoptera` },
  { label: 'synonyms', value: nf(synonyms.value), note: `on ${nf(current.value.filter(([, t]) => t.s?.length).length)} terms` },
  { label: 'references cited', value: nf(cited.value.length) },
  { label: 'references in TaxonWorks', value: `${Math.round((100 * linked.value) / Math.max(cited.value.length, 1))}%`, note: `${nf(linked.value)} of ${nf(cited.value.length)}` },
  { label: 'groups covered', value: nf(groups.value.length) },
  { label: 'releases', value: nf(releases.value.length) }
])

const byPrefix = computed(() => {
  const m = {}
  for (const [id] of current.value) { const p = id.split(':')[0]; m[p] = (m[p] || 0) + 1 }
  return Object.entries(m).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
})
const synKinds = computed(() => {
  const m = { exact: 0, related: 0, 'alternative label': 0 }
  for (const [, t] of current.value) for (const s of t.s || []) m[s[1] === 'e' ? 'exact' : s[1] === 'a' ? 'alternative label' : 'related']++
  return Object.entries(m).map(([label, n]) => ({ label, n }))
})
const decades = computed(() => {
  const m = {}
  for (const k of cited.value) {
    const y = (hao.value.refs[k].t.match(/\b(1[789]\d\d|20[0-2]\d)\b/) || [])[1]
    if (y) { const d = Math.floor(+y / 10) * 10; m[d] = (m[d] || 0) + 1 }
  }
  const ks = Object.keys(m).map(Number)
  if (!ks.length) return []
  const out = []
  for (let d = Math.min(...ks); d <= Math.max(...ks); d += 10) out.push({ label: d, n: m[d] || 0 })
  return out
})
const maxDecade = computed(() => Math.max(1, ...decades.value.map((d) => d.n)))

function exportCsv() {
  const rows = [['measure', 'value']]
  for (const k of kpis.value) rows.push([k.label, k.value + (k.note ? ` (${k.note})` : '')])
  for (const b of byPrefix.value) rows.push([`terms from ${b.label}`, b.n])
  for (const b of synKinds.value) rows.push([`${b.label} synonyms`, b.n])
  for (const d of decades.value) rows.push([`references from the ${d.label}s`, d.n])
  for (const r of releases.value) rows.push([`${r.name} (${r.version}) terms / synonyms / refs from TaxonWorks`, `${r.terms} / ${r.synonyms ?? ''} / ${r.twSources ?? ''}`])
  for (const g of groups.value) rows.push([`group ${g.n}: works / names`, `${g.works} / ${g.names}`])
  download(`HAO-statistics-${hao.value.version}.csv`, csv(rows))
}
const print = () => window.print()
onMounted(() => (document.title = 'Statistics — Hymenoptera Anatomy Ontology'))
</script>
