<script setup lang="ts">
import { withBase } from 'vitepress'

import type { HomeContent } from '../../data/home-content'

defineProps<{
  hero: HomeContent['hero']
  iconSprite: string
}>()
</script>

<template>
  <section class="docs-hero" aria-labelledby="docs-hero-title">
    <div class="docs-hero-backdrop" aria-hidden="true" />
    <div class="docs-hero-inner">
      <div class="docs-hero-header">
        <p class="docs-eyebrow">{{ hero.eyebrow }}</p>
        <h1 id="docs-hero-title" class="docs-hero-title">
          {{ hero.headlinePrefix }}
          <em>{{ hero.headlineAccent }}</em>
        </h1>
        <p class="docs-hero-subtitle">{{ hero.subtitle }}</p>

        <div class="docs-hero-actions">
          <a
            v-for="action in hero.actions"
            :key="action.href"
            class="docs-btn"
            :class="action.variant === 'primary' ? 'docs-btn-primary' : 'docs-btn-secondary'"
            :href="withBase(action.href)"
          >
            <span>{{ action.label }}</span>
            <svg v-if="action.icon" class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#${action.icon}`" />
            </svg>
          </a>
        </div>

        <dl class="docs-hero-specs">
          <div v-for="spec in hero.specs" :key="spec.label" class="docs-spec-item">
            <dt>{{ spec.label }}</dt>
            <dd>{{ spec.value }}</dd>
          </div>
        </dl>
      </div>

      <figure class="docs-stage">
        <div class="docs-stage-bar" aria-hidden="true">
          <span class="docs-stage-dots">
            <i />
            <i />
            <i />
          </span>
          <span class="docs-stage-title">{{ hero.previewWindowTitle }}</span>
          <span class="docs-stage-badge">{{ hero.previewStatus }}</span>
        </div>
        <div class="docs-stage-frame">
          <img
            :src="withBase('/game-preview.webp')"
            :alt="hero.previewAlt"
            width="1440"
            height="810"
            fetchpriority="high"
          />
        </div>
      </figure>
    </div>
  </section>
</template>
