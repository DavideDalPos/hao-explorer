<template>
  <template v-if="items.length">
    <details
      v-for="r in items"
      :key="r.key"
      class="ref"
    >
      <summary>{{ r.short }}<span
        v-if="r.groups"
        class="ref-groups"
      >{{ ' · ' + r.groups }}</span></summary>
      <p>
        <span v-html="r.html" />
        <RouterLink
          v-if="r.page"
          class="more"
          :to="r.page"
        >Reference page →</RouterLink>
      </p>
    </details>
  </template>
  <span
    v-else
    class="muted"
  >—</span>
</template>

<script setup>
// References of a synonym or definition: the HAO reference numbers (shown with the TaxonWorks citation once it is
// linked), plus citations written into the ontology as text
import { computed } from 'vue'
import { citeHtml, group, groupsOf, ref, refPath, refShort, shortRef } from '../lib/hao.js'

const props = defineProps({
  refs: { type: Array, default: () => [] },
  cites: { type: Array, default: () => [] }
})
const items = computed(() => [
  ...props.refs.filter((k) => ref(k)).map((k) => ({ key: k, short: refShort(k), html: citeHtml(ref(k)), page: refPath(k), groups: groupsOf(k).map((g) => group(g[0])?.n).filter(Boolean).join(', ') })),
  ...props.cites.map((c, i) => ({ key: 'c' + i, short: shortRef(c.split('\n')[0]), html: citeHtml({ t: c }) }))
])
</script>
