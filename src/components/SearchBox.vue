<template>
  <div
    ref="box"
    class="search"
    role="search"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      id="q"
      v-model="query"
      type="search"
      placeholder="Search 3,000+ terms and synonyms, e.g. scutum, propodeum, Hinterleib"
      autocomplete="off"
      aria-label="Search terms and synonyms"
      aria-controls="results"
      @focus="open = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="go(hits[current >= 0 ? current : 0])"
      @keydown.esc="open = false"
    />
    <div
      id="results"
      class="results"
      :class="{ open: open && query.trim().length > 1 }"
      role="listbox"
    >
      <RouterLink
        v-for="(h, i) in hits"
        :key="h.id"
        :to="termPath(h.id)"
        role="option"
        :class="{ on: i === current }"
        @click="close"
      >
        {{ h.label }}
        <span class="why">
          <template v-if="h.synonym">synonym: {{ h.synonym }} · </template>
          <span class="mono">{{ h.id }}</span>
        </span>
      </RouterLink>
      <div
        v-if="!hits.length"
        class="none"
      >
        No term or synonym matches “{{ query }}”.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { search, termPath } from '../lib/hao.js'

const router = useRouter()
const query = ref('')
const open = ref(false)
const current = ref(-1)
const box = ref(null)
const hits = computed(() => search(query.value))
watch(query, () => { current.value = -1; open.value = true })

function move(step) {
  if (!hits.value.length) return
  current.value = Math.max(0, Math.min(hits.value.length - 1, current.value + step))
}
function close() {
  open.value = false
  query.value = ''
}
function go(hit) {
  if (!hit) return
  router.push(termPath(hit.id))
  close()
}
const outside = (e) => { if (!box.value?.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('click', outside))
onBeforeUnmount(() => document.removeEventListener('click', outside))
</script>
