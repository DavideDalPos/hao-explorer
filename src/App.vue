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
        <RouterLink to="/releases">Releases</RouterLink>
        <RouterLink to="/about">About</RouterLink>
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

  <footer class="foot">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <RouterLink class="brand" to="/">
            <span class="brand-mark">HAO</span><b>Hymenoptera Anatomy Ontology</b>
          </RouterLink>
          <p>
            The shared vocabulary of wasp, bee, ant and sawfly anatomy: definitions, relations and the names each part
            has carried in the literature.
          </p>
          <RouterLink
            class="foot-version"
            to="/releases"
          >{{ hao?.release || 'Release' }} · {{ hao?.version || '…' }}</RouterLink>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><RouterLink to="/">Map of the body</RouterLink></li>
            <li><RouterLink to="/references">References</RouterLink></li>
            <li><RouterLink to="/compare">Compare groups</RouterLink></li>
            <li><RouterLink to="/releases">Releases</RouterLink></li>
            <li><RouterLink to="/statistics">Statistics</RouterLink></li>
            <li><RouterLink to="/about">About HAO</RouterLink></li>
          </ul>
        </div>
        <div>
          <h4>Ontology</h4>
          <ul>
            <li><a href="http://purl.obolibrary.org/obo/hao.owl">Download hao.owl</a></li>
            <li><a href="http://purl.obolibrary.org/obo/hao.obo">Download hao.obo</a></li>
            <li><a href="https://www.ebi.ac.uk/ols4/ontologies/hao">Ontology Lookup Service ↗</a></li>
            <li><a href="https://github.com/DavideDalPos/hao2">Source on GitHub ↗</a></li>
          </ul>
        </div>
        <div>
          <h4>Contribute</h4>
          <ul>
            <li><a href="https://github.com/DavideDalPos/hao2/issues/new/choose">Request a term or report a problem ↗</a></li>
            <li><a href="https://github.com/DavideDalPos/hao2/blob/main/CONTRIBUTING.md">How to contribute ↗</a></li>
            <li><a href="https://sfg.taxonworks.org">References in TaxonWorks ↗</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <span>Content licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Terms, definitions and relations from the ontology; references from the HAO project in TaxonWorks.</span>
        <span>Cite: Yoder et al. (2010) A gross anatomy ontology for Hymenoptera. <i>PLoS ONE</i> 5(12): e15991.</span>
      </div>
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
