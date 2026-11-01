<template>
  <nav
    class="crumbs"
    aria-label="Where this page sits"
  >
    <RouterLink to="/">Home</RouterLink>
  </nav>
  <h1 class="page-title">Releases</h1>
  <p class="lede">
    Every published version of the ontology, newest first, with what changed since the one before. Each release can be
    downloaded exactly as it was.
  </p>

  <p
    v-if="!releases.length"
    class="muted"
  >No release information in this copy of the site.</p>

  <ol class="rel-list">
    <li
      v-for="(r, i) in releases"
      :key="r.tag"
      class="rel"
    >
      <div class="rel-dot" />
      <div class="card rel-card">
        <div class="rel-head">
          <h2>{{ r.name }}</h2>
          <span
            v-if="i === 0"
            class="kind ok"
          >current</span>
          <span class="muted mono">release {{ r.version }}</span>
        </div>
        <p
          v-if="r.notes"
          class="rel-notes"
        >{{ r.notes }}</p>
        <p class="rel-meta muted">
          {{ nf(r.terms) }} terms
          <template v-if="r.published"> · published {{ r.published }}</template>
          <template v-if="r.url"> · <a :href="r.url" target="_blank" rel="noopener">on GitHub ↗</a></template>
          · download <a :href="r.files.owl">hao.owl</a>, <a :href="r.files.obo">hao.obo</a>
        </p>

        <template v-if="r.diff">
          <p
            v-if="!Object.keys(r.diff).length"
            class="muted rel-meta"
          >No changes to terms, synonyms or references.</p>
          <div class="rel-changes">
            <details
              v-for="g in groups(r.diff)"
              :key="g.key"
              class="rel-group"
            >
              <summary><b>{{ nf(g.items.length) }}</b> {{ g.label(g.items.length) }}</summary>
              <ul>
                <li
                  v-for="(it, k) in g.items.slice(0, 200)"
                  :key="k"
                >
                  <template v-if="g.key === 'references'">
                    <RouterLink :to="refPath(it[0])">{{ refShort(it[0]) }}</RouterLink>
                    <span class="muted">{{ ' · ' }}cited {{ it[1] }} {{ it[1] === 1 ? 'time' : 'times' }}</span>
                  </template>
                  <template v-else-if="g.key === 'renamed'">
                    <RouterLink :to="termPath(it[0])">{{ termName(it[0]) }}</RouterLink>
                    <span class="muted">{{ ' · ' }}was “{{ it[1] }}”</span>
                  </template>
                  <template v-else-if="g.key === 'synonymsAdded' || g.key === 'synonymsRemoved'">
                    “{{ it[1] }}”<span class="muted">{{ ' on ' }}</span><RouterLink :to="termPath(it[0])">{{ termName(it[0]) }}</RouterLink>
                  </template>
                  <template v-else>
                    <RouterLink :to="termPath(it)">{{ termName(it) }}</RouterLink>
                    <span class="muted mono">{{ ' ' + it }}</span>
                  </template>
                </li>
                <li
                  v-if="g.items.length > 200"
                  class="muted"
                >and {{ g.items.length - 200 }} more</li>
              </ul>
            </details>
          </div>
        </template>
        <p
          v-else
          class="muted rel-meta"
        >{{ r.baseline ? 'The starting point: changes are counted from here.' : 'First release on record.' }}</p>
      </div>
    </li>
  </ol>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { hao, refPath, refShort, termName, termPath } from '../lib/hao.js'

const nf = (n) => n.toLocaleString('en-US')
const releases = computed(() => hao.value.releases || [])
const s = (n, one, many) => (n === 1 ? one : many)
const LABELS = {
  added: (n) => s(n, 'new term', 'new terms'),
  obsoleted: (n) => s(n, 'term made obsolete', 'terms made obsolete'),
  renamed: (n) => s(n, 'term renamed', 'terms renamed'),
  definitions: (n) => s(n, 'definition changed', 'definitions changed'),
  synonymsAdded: (n) => s(n, 'synonym added', 'synonyms added'),
  synonymsRemoved: (n) => s(n, 'synonym removed', 'synonyms removed'),
  references: (n) => s(n, 'reference now cited from TaxonWorks', 'references now cited from TaxonWorks')
}
const groups = (diff) => Object.keys(LABELS).filter((k) => diff[k]).map((k) => ({ key: k, label: LABELS[k], items: diff[k] }))
onMounted(() => (document.title = 'Releases — Hymenoptera Anatomy Ontology'))
</script>
