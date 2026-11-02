<template>
  <div
    v-if="!g"
    class="notfound"
  >
    No group {{ id }}. <RouterLink to="/references">All references</RouterLink>.
  </div>

  <template v-else>
    <nav
      class="crumbs"
      aria-label="Where this page sits"
    >
      <RouterLink to="/">Home</RouterLink><span>›</span><RouterLink to="/references">References</RouterLink>
    </nav>
    <h1 class="page-title">{{ g.n }}</h1>
    <p class="lede">
      <span v-if="g.r">{{ g.r }} · </span>The anatomy of {{ g.n }} in the ontology: the works that studied it and the
      names they use for each part.
    </p>

    <div class="actions no-print">
      <button
        class="btn"
        type="button"
        :disabled="!rows.length"
        @click="exportGlossary"
      >Download glossary (CSV)</button>
      <button
        class="btn"
        type="button"
        @click="print"
      >Print or save as PDF</button>
      <RouterLink
        class="btn"
        :to="{ path: '/compare', query: { a: id } }"
      >Compare with another group</RouterLink>
    </div>

    <h2 class="sec">Works</h2>
    <div class="card reflist">
      <RouterLink
        v-for="w in works"
        :key="w.key"
        :to="refPath(w.key)"
        class="refrow"
      >
        <span v-html="w.html" />
        <span class="badges">
          <span
            v-if="w.pages"
            class="kind"
          >pp. {{ w.pages }}</span>
          <span class="kind">{{ w.n }} {{ w.n === 1 ? 'use' : 'uses' }}</span>
        </span>
      </RouterLink>
    </div>

    <h2 class="sec">Names used in {{ g.n }}</h2>
    <div
      class="card"
      style="padding: 12px 18px"
    >
      <table
        v-if="rows.length"
        class="syn"
      >
        <thead><tr><th>Term</th><th>Name used</th><th>Work</th></tr></thead>
        <tbody>
          <tr
            v-for="(r, i) in rows"
            :key="i"
          >
            <td><RouterLink :to="termPath(r.id)">{{ termName(r.id) }}</RouterLink></td>
            <td>
              <template v-if="r.what === 'definition'">
                <span class="muted">the definition</span>
              </template>
              <template v-else>{{ r.what }}</template>
            </td>
            <td><RouterLink :to="refPath(r.ref)">{{ refShort(r.ref) }}</RouterLink></td>
          </tr>
        </tbody>
      </table>
      <p
        v-else
        class="muted"
        style="margin: 0"
      >These works are not cited by any term yet.</p>
    </div>
  </template>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { citedBy, csv, download, group, groupsOf, ref, refPath, refShort, term, termName, termPath, worksOfGroup } from '../lib/hao.js'

const props = defineProps({ id: { type: String, required: true } })
const g = computed(() => group(props.id))
const works = computed(() =>
  worksOfGroup(props.id)
    .map((key) => ({
      key,
      html: ref(key).h ? ref(key).h.replace(/<(?!\/?i>)[^>]*>/g, '') : ref(key).t.replace(/&/g, '&amp;').replace(/</g, '&lt;'),
      pages: groupsOf(key).find((x) => x[0] === props.id)?.[1],
      n: citedBy(key).length
    }))
    .sort((a, b) => ref(a.key).t.localeCompare(ref(b.key).t))
)
const rows = computed(() =>
  works.value
    .flatMap((w) => citedBy(w.key).map((u) => ({ ...u, ref: w.key })))
    .sort((a, b) => termName(a.id).localeCompare(termName(b.id)) || a.what.localeCompare(b.what))
)
// glossary: every term the group's works use, with ID, definition, the name used and the work
function exportGlossary() {
  const out = [['term', 'HAO ID', 'definition', 'name used in ' + g.value.n, 'reference', 'pages', 'PURL']]
  for (const r of rows.value) {
    const pages = groupsOf(r.ref).find((x) => x[0] === props.id)?.[1] || ''
    out.push([termName(r.id), r.id, term(r.id)?.d || '', r.what === 'definition' ? '' : r.what, ref(r.ref).t, pages,
      'http://purl.obolibrary.org/obo/' + r.id.replace(':', '_')])
  }
  download(`HAO-glossary-${g.value.n}.csv`, csv(out))
}
const print = () => window.print()

watchEffect(() => (document.title = g.value ? `${g.value.n} — Hymenoptera Anatomy Ontology` : 'Hymenoptera Anatomy Ontology'))
</script>
