<template>
  <section class="hero">
    <SpecimenFigure
      :figure="FIGURES[0]"
      interactive
    />
    <div>
      <h1>Hymenoptera Anatomy Ontology</h1>
      <p>
        The shared vocabulary of wasp, bee, ant and sawfly anatomy: every term with its definition, its place among the
        other parts, and the many names it has carried in the literature, each traced to the work that used it.
      </p>
      <div class="stats">
        <div class="stat"><b>{{ nf(counts.terms) }}</b><span>anatomical terms</span></div>
        <div class="stat"><b>{{ nf(counts.synonyms) }}</b><span>synonyms</span></div>
        <RouterLink class="stat" to="/references"><b>{{ nf(counts.refs) }}</b><span>references</span></RouterLink>
      </div>
      <p class="pilot">
        Search a term or one of its old names above, or click a part of the wasp. Photos are linked to seven terms so
        far; the other terms show where images will go.
      </p>
    </div>
  </section>

  <h2 class="sec">Start from a body region</h2>
  <div class="regions">
    <RouterLink
      v-for="[id, label] in REGIONS"
      :key="id"
      class="chip"
      :to="termPath(id)"
    >{{ label }}</RouterLink>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { hao, termPath } from '../lib/hao.js'
import { FIGURES, REGIONS } from '../lib/figures.js'
import SpecimenFigure from '../components/SpecimenFigure.vue'

const nf = (n) => n.toLocaleString('en-US')
const counts = computed(() => {
  const current = Object.values(hao.value.terms).filter((t) => !t.o)
  return {
    terms: current.length,
    synonyms: current.reduce((n, t) => n + (t.s?.length || 0), 0),
    refs: Object.keys(hao.value.refs).filter((k) => !k.startsWith('tw')).length
  }
})
onMounted(() => (document.title = 'HAO Explorer'))
</script>
