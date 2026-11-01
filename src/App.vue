<template>
  <header class="top">
    <div class="wrap">
      <RouterLink class="brand" to="/" aria-label="Hymenoptera Anatomy Ontology, start page">
        <span class="brand-mark">HAO</span><b>Hymenoptera Anatomy Ontology</b>
      </RouterLink>
      <SearchBox v-if="hao && route.path !== '/'" />
      <nav
        class="topnav"
        aria-label="Main"
      >
        <RouterLink to="/">Explore</RouterLink>
        <RouterLink to="/references">References</RouterLink>
      </nav>
      <button
        class="theme-btn"
        type="button"
        :aria-label="theme === 'dark' ? 'Switch to white background' : 'Switch to black background'"
        :title="theme === 'dark' ? 'White background' : 'Black background'"
        @click="toggleTheme"
      >
        <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" /></svg>
      </button>
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
import { theme, toggleTheme } from './lib/theme.js'
import { useRoute } from 'vue-router'
const route = useRoute()
import SearchBox from './components/SearchBox.vue'

const error = ref('')
onMounted(() => loadHao().catch((e) => (error.value = e.message)))
</script>
