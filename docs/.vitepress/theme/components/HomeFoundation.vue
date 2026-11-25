<script setup lang="ts">
import { withBase } from 'vitepress'

import type { HomeContent } from '../../data/home-content'

defineProps<{
  foundation: HomeContent['foundation']
  iconSprite: string
}>()
</script>

<template>
  <section class="docs-band" aria-labelledby="docs-foundation-title">
    <div class="docs-band-inner">
      <header class="docs-section-head">
        <p class="docs-section-eyebrow">{{ foundation.eyebrow }}</p>
        <h2 id="docs-foundation-title" class="docs-section-title">{{ foundation.title }}</h2>
        <p class="docs-section-desc">{{ foundation.description }}</p>
      </header>

      <div class="docs-matrix docs-matrix-3">
        <a
          v-for="item in foundation.items"
          :key="item.href"
          class="docs-cell"
          :href="withBase(item.href)"
        >
          <div class="docs-cell-top">
            <span class="docs-cell-icon">
              <svg class="docs-icon" aria-hidden="true" focusable="false">
                <use :href="`${iconSprite}#${item.icon}`" />
              </svg>
            </span>
            <span class="docs-cell-meta">{{ item.meta }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
          <span class="docs-cell-arrow" aria-hidden="true">
            <svg class="docs-icon" focusable="false">
              <use :href="`${iconSprite}#arrow-right`" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  </section>
</template>
