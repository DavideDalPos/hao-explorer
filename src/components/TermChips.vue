<template>
  <ul>
    <li
      v-for="id in shown"
      :key="id"
    >
      <RouterLink
        v-if="term(id)"
        class="chip"
        :to="termPath(id)"
      >{{ termName(id) }}</RouterLink>
      <span
        v-else
        class="chip"
      >{{ id }}</span>
    </li>
    <li
      v-if="!all && sorted.length > max"
      class="more"
    >
      <button
        class="btn"
        type="button"
        @click="all = true"
      >+ {{ sorted.length - max }} more</button>
    </li>
  </ul>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { term, termName, termPath } from '../lib/hao.js'

const props = defineProps({
  ids: { type: Array, required: true },
  max: { type: Number, default: 18 }
})
const all = ref(false)
watch(() => props.ids, () => (all.value = false))
const sorted = computed(() => [...new Set(props.ids)].sort((a, b) => termName(a).localeCompare(termName(b))))
const shown = computed(() => (all.value ? sorted.value : sorted.value.slice(0, props.max)))
</script>
