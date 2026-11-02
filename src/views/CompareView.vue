<template>
  <nav
    class="crumbs"
    aria-label="Where this page sits"
  >
    <RouterLink to="/">Home</RouterLink><span>›</span><RouterLink to="/references">References</RouterLink>
  </nav>
  <h1 class="page-title">Compare groups</h1>
  <p class="lede">
    The names two groups use for the same parts, side by side, from the works linked to each group in TaxonWorks.
  </p>

  <p
    v-if="options.length < 2"
    class="pilot"
  >
    Comparing needs at least two groups. Groups come from TaxonWorks: cite a source on an OTU in the HAO project
    (see ADDING-REFERENCES.md). So far: {{ options.map((o) => o.n).join(', ') || 'none' }}.
  </p>

  <div class="compare-pick">
    <label>
      <span>First group</span>
      <select v-model="a">
        <option
          v-for="o in options"
          :key="o.key"
          :value="o.key"
        >{{ o.n }}</option>
      </select>
    </label>
    <label>
      <span>Second group</span>
      <select v-model="b">
        <option
          v-for="o in options"
          :key="o.key"
          :value="o.key"
        >{{ o.n }}</option>
      </select>
    </label>
    <label class="compare-only">
      <input
        v-model="sharedOnly"
        type="checkbox"
      > only parts named in both
    </label>
    <button
      v-if="rows.length"
      class="btn"
      type="button"
      @click="exportCsv"
    >Download table (CSV)</button>
  </div>

  <div
    v-if="a && b"
    class="card"
    style="padding: 12px 18px; overflow-x: auto"
  >
    <table
      v-if="rows.length"
      class="syn compare"
    >
      <thead>
        <tr>
          <th>Term</th>
          <th><RouterLink :to="groupPath(a)">{{ group(a)?.n }}</RouterLink></th>
          <th><RouterLink :to="groupPath(b)">{{ group(b)?.n }}</RouterLink></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in rows"
          :key="r.id"
        >
          <td>
            <RouterLink :to="termPath(r.id)">{{ termName(r.id) }}</RouterLink>
            <span class="muted mono">{{ ' ' + r.id }}</span>
          </td>
          <td
            v-for="side in [r.a, r.b]"
            :key="side === r.a ? 'a' : 'b'"
          >
            <span
              v-if="!side.length"
              class="muted"
            >—</span>
            <div
              v-for="(n, k) in side"
              :key="k"
            >
              {{ n.what === 'definition' ? 'the term itself' : `“${n.what}”` }}
              <RouterLink
                class="muted"
                :to="refPath(n.ref)"
              >{{ refShort(n.ref) }}</RouterLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p
      v-else
      class="muted"
      style="margin: 0"
    >No parts to compare yet.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { csv, download, group, groupPath, hao, namesInGroup, refPath, refShort, termName, termPath } from '../lib/hao.js'

const route = useRoute()
const router = useRouter()
const options = computed(() =>
  Object.entries(hao.value.groups || {}).map(([key, g]) => ({ key, n: g.n })).sort((x, y) => x.n.localeCompare(y.n))
)
const a = ref(route.query.a || options.value[0]?.key || '')
const b = ref(route.query.b || options.value[1]?.key || options.value[0]?.key || '')
const sharedOnly = ref(false)
watch([a, b], () => router.replace({ query: { a: a.value, b: b.value } }))

const byTerm = (key) => {
  const m = new Map()
  for (const n of namesInGroup(key)) (m.get(n.id) || m.set(n.id, []).get(n.id)).push(n)
  return m
}
const rows = computed(() => {
  if (!a.value || !b.value) return []
  const A = byTerm(a.value), B = byTerm(b.value)
  const ids = [...new Set([...A.keys(), ...B.keys()])]
  return ids
    .map((id) => ({ id, a: A.get(id) || [], b: B.get(id) || [] }))
    .filter((r) => !sharedOnly.value || (r.a.length && r.b.length))
    .sort((x, y) => termName(x.id).localeCompare(termName(y.id)))
})

function exportCsv() {
  const names = (side) => side.map((n) => (n.what === 'definition' ? termName(n.id) : n.what) + ' (' + refShort(n.ref) + ')').join('; ')
  download(
    `HAO-compare-${group(a.value).n}-${group(b.value).n}.csv`,
    csv([['term', 'HAO ID', group(a.value).n, group(b.value).n], ...rows.value.map((r) => [termName(r.id), r.id, names(r.a), names(r.b)])])
  )
}
onMounted(() => (document.title = 'Compare groups — Hymenoptera Anatomy Ontology'))
</script>
