<template>
  <nav
    class="crumbs"
    aria-label="Where this page sits"
  >
    <RouterLink to="/">Home</RouterLink>
  </nav>
  <h1 class="page-title">References</h1>
  <p class="lede">
    The works that defined the terms of the ontology or used their names. Citations come from the HAO project in
    TaxonWorks; those not linked yet still show the old HAO bibliography.
  </p>

  <div class="stats">
    <div class="stat"><b>{{ nf(counts.cited) }}</b><span>cited in the ontology</span></div>
    <div class="stat"><b>{{ nf(counts.linked) }}</b><span>linked to TaxonWorks</span></div>
    <div
      v-if="counts.extra"
      class="stat"
    ><b>{{ nf(counts.extra) }}</b><span>in TaxonWorks, not cited yet</span></div>
  </div>
  <div
    class="meter"
    role="img"
    :aria-label="`${counts.linked} of ${counts.cited} references linked to TaxonWorks`"
  ><span :style="{ width: (100 * counts.linked) / Math.max(counts.cited, 1) + '%' }" /></div>

  <div class="filters">
    <input
      v-model="q"
      class="filter-input"
      type="search"
      placeholder="Filter by author, year or title"
      aria-label="Filter references"
    >
    <div
      class="seg"
      role="group"
      aria-label="Show"
    >
      <button
        v-for="[k, label] in VIEWS"
        :key="k"
        type="button"
        :class="{ on: view === k }"
        @click="view = k"
      >{{ label }}</button>
    </div>
  </div>

  <div class="card reflist">
    <RouterLink
      v-for="r in shown"
      :key="r.key"
      :to="refPath(r.key)"
      class="refrow"
    >
      <span v-html="r.html" />
      <span class="badges">
        <span
          v-if="r.tw"
          class="kind ok"
        >TaxonWorks</span>
        <span
          v-if="!r.n"
          class="kind"
        >not cited yet</span>
        <span
          v-if="r.n"
          class="kind"
        >{{ r.n }} {{ r.n === 1 ? 'use' : 'uses' }}</span>
      </span>
    </RouterLink>
    <p
      v-if="!shown.length"
      class="muted"
      style="margin: 0"
    >No references match.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref as vref } from 'vue'
import { citedBy, hao, refPath } from '../lib/hao.js'

const VIEWS = [['all', 'All'], ['linked', 'In TaxonWorks'], ['todo', 'Not linked yet']]
const q = vref('')
const view = vref('all')
const nf = (n) => n.toLocaleString('en-US')

// plain text of a citation's HTML, for display without links inside the row link
const plain = (h) => h.replace(/<(?!\/?i>)[^>]*>/g, '')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const all = computed(() =>
  Object.entries(hao.value.refs)
    .map(([key, r]) => ({ key, ...r, html: r.h ? plain(r.h) : esc(r.t), n: citedBy(key).length, low: r.t.toLowerCase() }))
    .sort((a, b) => a.t.localeCompare(b.t, 'en', { sensitivity: 'base' }))
)
const counts = computed(() => ({
  cited: all.value.filter((r) => r.n).length,
  linked: all.value.filter((r) => r.n && r.tw).length,
  extra: all.value.filter((r) => !r.n).length
}))
const shown = computed(() => {
  const s = q.value.trim().toLowerCase()
  return all.value.filter((r) =>
    (view.value === 'all' || (view.value === 'linked' ? r.tw : !r.tw)) && (!s || r.low.includes(s))
  )
})
onMounted(() => (document.title = 'References — HAO Explorer'))
</script>
