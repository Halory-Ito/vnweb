<script setup lang="ts">
import { withBase } from 'vitepress'

import type { HomeContent } from '../../data/home-content'

defineProps<{
  roadmap: HomeContent['roadmap']
  iconSprite: string
}>()
</script>

<template>
  <section class="docs-band docs-band-tinted" aria-labelledby="docs-roadmap-title">
    <div class="docs-band-inner">
      <header class="docs-section-head docs-section-head-split">
        <div>
          <p class="docs-section-eyebrow">{{ roadmap.eyebrow }}</p>
          <h2 id="docs-roadmap-title" class="docs-section-title">{{ roadmap.title }}</h2>
          <p class="docs-section-desc">{{ roadmap.description }}</p>
        </div>
        <a class="docs-inline-cta" :href="withBase(roadmap.ctaHref)">
          <span>{{ roadmap.ctaLabel }}</span>
          <svg class="docs-icon" aria-hidden="true" focusable="false">
            <use :href="`${iconSprite}#arrow-right`" />
          </svg>
        </a>
      </header>

      <div class="docs-matrix docs-matrix-2">
        <a
          v-for="track in roadmap.tracks"
          :key="track.index"
          class="docs-cell docs-track-cell"
          :href="withBase(track.href)"
        >
          <div class="docs-track-head">
            <span class="docs-track-index">{{ track.index }}</span>
            <span class="docs-track-pill">{{ track.status }}</span>
          </div>
          <h3>{{ track.title }}</h3>
          <p>{{ track.summary }}</p>
        </a>
      </div>

      <div class="docs-roadmap-footer">
        <div class="docs-roadmap-strip">
          <span class="docs-strip-label">
            <svg class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#layers`" />
            </svg>
            {{ roadmap.plannedLabel }}
          </span>
          <ul class="docs-tag-list">
            <li v-for="item in roadmap.plannedItems" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="docs-roadmap-strip">
          <span class="docs-strip-label">
            <svg class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#shield`" />
            </svg>
            {{ roadmap.securityLabel }}
          </span>
          <ul class="docs-tag-list">
            <li v-for="item in roadmap.securityItems" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
