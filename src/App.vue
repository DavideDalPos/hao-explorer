<template>
  <header class="top">
    <div class="wrap">
      <RouterLink class="brand" to="/" aria-label="HAO Explorer home">
        <b>HAO Explorer</b><span>Hymenoptera Anatomy Ontology</span>
      </RouterLink>
      <nav class="topnav"><RouterLink to="/references">References</RouterLink></nav>
      <SearchBox v-if="hao" />
    </div>
  </header>

  <main class="wrap">
    <p v-if="error" class="notfound">{{ error }}</p>
    <p v-else-if="!hao" class="loading">Loading the ontology…</p>
    <RouterView v-else />
  </main>

  <footer>
    <div class="wrap">
      Built from the HAO release {{ hao?.version || '…' }}. Terms, definitions, synonyms and relations come straight from the
      ontology; references come from the HAO project in TaxonWorks and the original HAO bibliography.
    </div>
  </footer>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { hao, loadHao } from './lib/hao.js'
import SearchBox from './components/SearchBox.vue'

const error = ref('')
onMounted(() => loadHao().catch((e) => (error.value = e.message)))
</script>
