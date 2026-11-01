<template>
  <div
    v-if="!t"
    class="notfound"
  >
    No term {{ termId }} in this release. <RouterLink to="/">Back to the start</RouterLink>.
  </div>

  <template v-else>
    <nav
      class="crumbs"
      aria-label="Where this part sits"
    >
      <RouterLink to="/">Home</RouterLink>
      <template
        v-for="c in crumbs"
        :key="c"
      >
        <span>›</span><RouterLink :to="termPath(c)">{{ termName(c) }}</RouterLink>
      </template>
    </nav>

    <article class="term">
      <div>
        <h1>{{ t.n }}</h1>
        <div class="idline">
          <span class="idchip">{{ termId }}</span>
          <button class="btn" type="button" @click="copy(termId, $event)">Copy ID</button>
          <button class="btn" type="button" @click="copy(purl(termId), $event)">Copy PURL</button>
        </div>

        <div
          v-if="t.o"
          class="obs"
        >
          This term is obsolete and should not be used.
          <template v-if="t.rb">Use <RouterLink :to="termPath(t.rb)">{{ termName(t.rb) }}</RouterLink> instead.</template>
        </div>

        <p
          v-if="t.d"
          class="def"
        >{{ t.d }}</p>
        <p
          v-else
          class="def muted"
        >No definition yet.</p>
        <div
          v-if="t.dr?.length"
          class="src"
        >Definition source: <RefList :refs="t.dr" /></div>

        <h2 class="sec">Synonyms and the literature</h2>
        <div
          class="card"
          style="padding: 12px 18px"
        >
          <table
            v-if="t.s?.length"
            class="syn"
          >
            <thead><tr><th>Name</th><th>Used in</th></tr></thead>
            <tbody>
              <tr
                v-for="[text, kind, refs, cites] in t.s"
                :key="text"
              >
                <td>
                  {{ text }}
                  <span v-if="kind === 'e'" class="kind">exact</span>
                  <span v-else-if="kind === 'a'" class="kind">other language</span>
                </td>
                <td><RefList :refs="refs" :cites="cites" /></td>
              </tr>
            </tbody>
          </table>
          <p
            v-else
            class="muted"
            style="margin: 0"
          >No synonyms recorded.</p>
        </div>

        <h2 class="sec">How it relates to other parts</h2>
        <div class="card rels">
          <div
            v-for="g in groups"
            :key="g.label"
            class="relgroup"
          >
            <h4>{{ g.label }}</h4>
            <TermChips :ids="g.ids" />
          </div>
          <p
            v-if="!groups.length"
            class="muted"
            style="margin: 0"
          >No relations recorded.</p>
        </div>

        <h2 class="sec">Network of connections</h2>
        <TermNetwork :id="termId" />
      </div>

      <aside class="side">
        <div class="card">
          <h3>Image</h3>
          <SpecimenFigure
            v-for="f in figures"
            :key="f.figure.id"
            :figure="f.figure"
            :part="f.part"
          />
          <div
            v-if="!figures.length"
            class="noimg"
          >
            No image linked yet.<br />Labelled photos and drawings of this part will appear here.
          </div>
        </div>

        <div class="card">
          <h3>Identifiers</h3>
          <div class="links">
            <a :href="purl(termId)">{{ purl(termId) }}</a>
            <a :href="olsUrl(termId)">View in the Ontology Lookup Service ↗</a>
            <span
              v-for="[x, label] in t.xr || []"
              :key="x"
            >
              <a :href="x.startsWith('http') ? x : undefined">{{ label || x }}</a>
              <span class="muted mono"> {{ x.replace('http://purl.obolibrary.org/obo/', '').replace('_', ':') }}</span>
            </span>
          </div>
        </div>

        <div
          v-if="t.c?.length"
          class="card"
        >
          <h3>Also cited</h3>
          <p
            v-for="c in t.c"
            :key="c"
            class="cite"
          >{{ c }}</p>
        </div>

        <div
          v-if="t.x?.length"
          class="card"
        >
          <h3>Editor notes</h3>
          <p
            v-for="n in t.x"
            :key="n"
            class="note"
          >{{ n }}</p>
        </div>

        <div class="card">
          <h3>Cite this term</h3>
          <p class="cite">
            Hymenoptera Anatomy Ontology (HAO). “{{ t.n }}” ({{ termId }}). Release {{ hao.version }}. {{ purl(termId) }}
          </p>
          <p
            v-if="t.b?.length"
            class="src"
            style="margin: 0"
          >Edited by {{ t.b.join(', ') }}</p>
        </div>
      </aside>
    </article>
  </template>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { fromSlug, hao, lineage, olsUrl, purl, relationName, term, termName, termPath } from '../lib/hao.js'
import { figuresFor } from '../lib/figures.js'
import RefList from '../components/RefList.vue'
import TermChips from '../components/TermChips.vue'
import TermNetwork from '../components/TermNetwork.vue'
import SpecimenFigure from '../components/SpecimenFigure.vue'

const props = defineProps({ id: { type: String, required: true } })
const termId = computed(() => fromSlug(props.id))
const t = computed(() => term(termId.value))
const crumbs = computed(() => lineage(termId.value))
const figures = computed(() => figuresFor(termId.value))

// relations grouped by property; "has parts" joins the asserted parts and every term that is part of this one
const groups = computed(() => {
  const x = t.value
  if (!x) return []
  const byRel = {}
  for (const [r, target] of x.r || []) if (r !== 'BFO:0000051') (byRel[relationName(r)] ||= []).push(target)
  const hasParts = [...new Set([...(x.r || []).filter((r) => r[0] === 'BFO:0000051').map((r) => r[1]), ...(x.p || [])])]
  return [
    x.i?.length ? { label: 'is a', ids: x.i } : null,
    ...Object.entries(byRel).map(([label, ids]) => ({ label, ids })),
    hasParts.length ? { label: 'has parts', ids: hasParts } : null,
    x.k?.length ? { label: 'more specific terms', ids: x.k } : null
  ].filter(Boolean)
})

watchEffect(() => (document.title = t.value ? `${t.value.n} — HAO Explorer` : 'HAO Explorer'))

function copy(text, e) {
  const btn = e.currentTarget
  navigator.clipboard?.writeText(text).then(() => {
    const label = btn.textContent
    btn.textContent = 'Copied ✓'
    setTimeout(() => (btn.textContent = label), 1500)
  }).catch(() => {})
}
</script>
