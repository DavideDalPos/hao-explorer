<template>
  <template v-if="items.length">
    <details
      v-for="r in items"
      :key="r.key"
      class="ref"
    >
      <summary>{{ r.short }}</summary>
      <p>{{ r.full }}</p>
    </details>
  </template>
  <span
    v-else
    class="muted"
  >—</span>
</template>

<script setup>
// References of a synonym or definition: old HAO bibliography numbers, plus citations written into the ontology
import { computed } from 'vue'
import { hao, shortRef } from '../lib/hao.js'

const props = defineProps({
  refs: { type: Array, default: () => [] },
  cites: { type: Array, default: () => [] }
})
const items = computed(() => [
  ...props.refs.filter((r) => hao.value.refs[r]).map((r) => ({ key: r, short: shortRef(hao.value.refs[r]), full: hao.value.refs[r] })),
  ...props.cites.map((c, i) => ({ key: 'c' + i, short: shortRef(c.split('\n')[0]), full: c }))
])
</script>
