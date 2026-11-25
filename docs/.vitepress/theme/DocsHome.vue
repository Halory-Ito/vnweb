<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

import { getHomeContent } from '../data/home-content'
import HomeDirectory from './components/HomeDirectory.vue'
import HomeFoundation from './components/HomeFoundation.vue'
import HomeHero from './components/HomeHero.vue'
import HomeRoadmap from './components/HomeRoadmap.vue'

const { lang } = useData()

const content = computed(() => getHomeContent(lang.value))
const iconSprite = withBase('/guide-icons.svg')
</script>

<template>
  <div class="docs-home">
    <HomeHero :hero="content.hero" :icon-sprite="iconSprite" />
    <HomeFoundation :foundation="content.foundation" :icon-sprite="iconSprite" />
    <HomeRoadmap :roadmap="content.roadmap" :icon-sprite="iconSprite" />
    <HomeDirectory :directory="content.directory" :icon-sprite="iconSprite" />
  </div>
</template>

<style src="./home.css"></style>
