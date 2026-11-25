<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'

import type { HomeContent } from '../../data/home-content'

const props = defineProps<{
  directory: HomeContent['directory']
  iconSprite: string
}>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(props.directory.quickStartCommand)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    copied.value = false
  }
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <section class="docs-band" aria-labelledby="docs-directory-title">
    <div class="docs-band-inner">
      <header class="docs-section-head">
        <p class="docs-section-eyebrow">{{ directory.eyebrow }}</p>
        <h2 id="docs-directory-title" class="docs-section-title">{{ directory.title }}</h2>
      </header>

      <nav class="docs-directory-grid" :aria-label="directory.title">
        <div v-for="group in directory.groups" :key="group.title" class="docs-directory-col">
          <h3>{{ group.title }}</h3>
          <ul>
            <li v-for="item in group.items" :key="item.href">
              <a :href="withBase(item.href)">
                <span>{{ item.label }}</span>
                <svg class="docs-icon docs-dir-arrow" aria-hidden="true" focusable="false">
                  <use :href="`${iconSprite}#arrow-right`" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div class="docs-quickstart">
        <div class="docs-quickstart-head">
          <span class="docs-quickstart-title">{{ directory.quickStartTitle }}</span>
          <div class="docs-quickstart-links">
            <a
              :href="directory.desktopHref"
              target="_blank"
              rel="noopener noreferrer"
              class="docs-quickstart-link"
            >
              <span>{{ directory.desktopLabel }}</span>
              <svg class="docs-icon" aria-hidden="true" focusable="false">
                <use :href="`${iconSprite}#arrow-up-right`" />
              </svg>
            </a>
            <a :href="withBase(directory.installGuideHref)" class="docs-quickstart-link">
              <span>{{ directory.installGuideLabel }}</span>
              <svg class="docs-icon" aria-hidden="true" focusable="false">
                <use :href="`${iconSprite}#arrow-right`" />
              </svg>
            </a>
          </div>
        </div>
        <div class="docs-quickstart-cmd">
          <code>
            <span class="docs-prompt" aria-hidden="true">$</span>
            {{ directory.quickStartCommand }}
          </code>
          <button
            type="button"
            class="docs-copy-btn"
            :aria-label="copied ? directory.copiedLabel : directory.copyLabel"
            @click="copyCommand"
          >
            <svg class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#${copied ? 'check' : 'copy'}`" />
            </svg>
            <span>{{ copied ? directory.copiedLabel : directory.copyLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
