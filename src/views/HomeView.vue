<template>
  <section class="intro">
    <h1>Hymenoptera Anatomy Ontology</h1>
    <p>
      The shared vocabulary of wasp, bee, ant and sawfly anatomy. Every part has a definition, its place in the body,
      and the names it has carried in the literature, each traced to the work that used it.
    </p>
    <SearchBox big />
    <div class="intro-stats">
      <span><b>{{ nf(counts.terms) }}</b> terms</span>
      <span><b>{{ nf(counts.synonyms) }}</b> synonyms</span>
      <RouterLink to="/references"><b>{{ nf(counts.refs) }}</b> references</RouterLink>
    </div>
  </section>

  <OntologyMap />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { hao } from '../lib/hao.js'
import OntologyMap from '../components/OntologyMap.vue'
import SearchBox from '../components/SearchBox.vue'

const nf = (n) => n.toLocaleString('en-US')
const counts = computed(() => {
  const current = Object.values(hao.value.terms).filter((t) => !t.o)
  return {
    terms: current.length,
    synonyms: current.reduce((n, t) => n + (t.s?.length || 0), 0),
    refs: Object.keys(hao.value.refs).filter((k) => !k.startsWith('tw')).length
  }
})
onMounted(() => (document.title = 'Hymenoptera Anatomy Ontology'))
</script>
