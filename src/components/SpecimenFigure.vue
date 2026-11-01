<template>
  <figure class="fig">
    <svg
      :viewBox="`0 0 ${figure.width} ${figure.height}`"
      role="img"
      :aria-label="`${figure.caption}${part ? ', with the ' + part.label.toLowerCase() + ' highlighted' : ''}`"
    >
      <defs>
        <filter :id="`grey-${uid}`" color-interpolation-filters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope=".45" />
            <feFuncG type="linear" slope=".45" />
            <feFuncB type="linear" slope=".45" />
          </feComponentTransfer>
        </filter>
        <filter :id="`soft-${uid}`"><feGaussianBlur stdDeviation="4" /></filter>
        <mask
          v-if="part"
          :id="`mask-${uid}`"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          :width="figure.width"
          :height="figure.height"
        >
          <rect :width="figure.width" :height="figure.height" fill="black" />
          <path :d="part.d" fill="white" :filter="`url(#soft-${uid})`" />
        </mask>
      </defs>

      <image :href="src" :width="figure.width" :height="figure.height" preserveAspectRatio="xMidYMid slice" />
      <!-- one part chosen: the rest of the specimen goes grey -->
      <template v-if="part">
        <image :href="src" :width="figure.width" :height="figure.height" preserveAspectRatio="xMidYMid slice" :filter="`url(#grey-${uid})`" />
        <image :href="src" :width="figure.width" :height="figure.height" preserveAspectRatio="xMidYMid slice" :mask="`url(#mask-${uid})`" />
        <path class="outline" :d="part.d" />
      </template>

      <!-- start page: every part is a link to its term -->
      <template v-if="interactive">
        <RouterLink
          v-for="p in figure.parts"
          :key="'hot-' + p.term"
          :to="termPath(p.term)"
          custom
          v-slot="{ navigate }"
        >
          <path class="hot" :d="p.d" aria-hidden="true" @click="navigate" />
        </RouterLink>
        <RouterLink
          v-for="p in figure.parts"
          :key="'tag-' + p.term"
          :to="termPath(p.term)"
          custom
          v-slot="{ navigate, href }"
        >
          <a :href="href" class="tag" :aria-label="p.label" @click="navigate">
            <line :x1="p.dot[0]" :y1="p.dot[1]" :x2="p.tx + pill(p) / 2" :y2="p.ty" stroke="rgba(255,255,255,.65)" stroke-dasharray="4 4" />
            <circle :cx="p.dot[0]" :cy="p.dot[1]" r="5" fill="#f0a43a" stroke="#15171c" stroke-width="2" />
            <rect :x="p.tx" :y="p.ty - 21" :width="pill(p)" height="30" rx="15" />
            <text :x="p.tx + pill(p) / 2" :y="p.ty" text-anchor="middle">{{ p.label }}</text>
          </a>
        </RouterLink>
      </template>
    </svg>
    <figcaption>
      <template v-if="interactive">Click a part of the wasp to open its term.</template>
      <template v-else><i>{{ figure.caption }}</i>, {{ part.label.toLowerCase() }} highlighted.</template>
      {{ figure.credit }}.
    </figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue'
import { termPath } from '../lib/hao.js'

const props = defineProps({
  figure: { type: Object, required: true },
  part: { type: Object, default: null },
  interactive: { type: Boolean, default: false }
})
const uid = Math.random().toString(36).slice(2, 8)
const src = computed(() => import.meta.env.BASE_URL + props.figure.image)
const pill = (p) => p.label.length * 12 + 30
</script>
