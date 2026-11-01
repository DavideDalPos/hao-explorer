<template>
  <div
    v-if="!r"
    class="notfound"
  >
    No reference {{ id }}. <RouterLink to="/references">All references</RouterLink>.
  </div>

  <template v-else>
    <nav
      class="crumbs"
      aria-label="Where this page sits"
    >
      <RouterLink to="/">Home</RouterLink><span>›</span><RouterLink to="/references">References</RouterLink>
    </nav>

    <article class="term">
      <div>
        <h1>{{ refShort(id) }}</h1>
        <p
          class="def cite-full"
          v-html="citeHtml(r)"
        />

        <h2 class="sec">Used in the ontology</h2>
        <div
          class="card"
          style="padding: 12px 18px"
        >
          <table
            v-if="uses.length"
            class="syn"
          >
            <thead><tr><th>Term</th><th>For</th></tr></thead>
            <tbody>
              <tr
                v-for="u in uses"
                :key="u.id + u.what"
              >
                <td><RouterLink :to="termPath(u.id)">{{ termName(u.id) }}</RouterLink></td>
                <td>{{ u.what === 'definition' ? 'the definition' : `the synonym “${u.what}”` }}</td>
              </tr>
            </tbody>
          </table>
          <p
            v-else
            class="muted"
            style="margin: 0"
          >Not cited by any term yet.</p>
        </div>
      </div>

      <aside class="side">
        <div class="card">
          <h3>Links</h3>
          <div class="links">
            <a
              v-if="r.doi"
              :href="`https://doi.org/${r.doi}`"
            >doi:{{ r.doi }}</a>
            <a
              v-if="r.u"
              :href="r.u"
              target="_blank"
              rel="noopener"
            >Read it online ↗</a>
            <a
              v-if="r.tw"
              :href="twSourceUrl(r.tw)"
              target="_blank"
              rel="noopener"
            >TaxonWorks source {{ r.tw }} (editors) ↗</a>
            <span
              v-if="r.hy"
              class="muted mono"
            >{{ hymaoUri(r.hy) }}</span>
          </div>
        </div>
        <div
          v-if="!r.tw && r.hy"
          class="card"
        >
          <h3>Not yet in TaxonWorks</h3>
          <p
            class="src"
            style="margin: 0"
          >
            This citation is from the old HAO bibliography. To link it, add the source to the HAO project in TaxonWorks
            with the URI identifier <span class="mono">{{ hymaoUri(r.hy) }}</span>.
          </p>
        </div>
      </aside>
    </article>
  </template>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { citedBy, citeHtml, hymaoUri, ref, refShort, termName, termPath, twSourceUrl } from '../lib/hao.js'

const props = defineProps({ id: { type: String, required: true } })
const r = computed(() => ref(props.id))
const uses = computed(() =>
  citedBy(props.id).slice().sort((a, b) => termName(a.id).localeCompare(termName(b.id)) || a.what.localeCompare(b.what))
)
watchEffect(() => (document.title = r.value ? `${refShort(props.id)} — HAO Explorer` : 'HAO Explorer'))
</script>
