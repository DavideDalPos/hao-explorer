<template>
  <header class="top">
    <div class="wrap">
      <RouterLink class="brand" to="/" aria-label="HAO Explorer home">
        <b>HAO Explorer</b><span>Hymenoptera Anatomy Ontology</span>
      </RouterLink>
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
      ontology; references are resolved from the HAO bibliography.
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
