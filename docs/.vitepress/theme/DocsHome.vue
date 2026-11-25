<script setup lang="ts">
import { withBase } from 'vitepress'

import { guideModules } from '../guide-modules'

const iconSprite = withBase('/guide-icons.svg')
</script>

<template>
  <div class="docs-home">
    <section class="docs-hero" aria-labelledby="docs-home-title">
      <div class="docs-hero-copy">
        <h1 id="docs-home-title">视觉小说与<br />本地游戏管理</h1>
        <p>扫描本地游戏、记录游玩时长，整理攻略、音乐和游戏存档。</p>
        <div class="docs-hero-actions">
          <a
            class="docs-button docs-button-primary"
            :href="withBase('/guide/intro/installation-and-configuration')"
          >
            安装与配置
            <svg class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#arrow-right`" />
            </svg>
          </a>
          <a class="docs-button" :href="withBase('/guide/intro/what-is-vnweb')">使用指南</a>
        </div>
      </div>
      <figure class="docs-preview">
        <img
          :src="withBase('/game-preview.webp')"
          alt="vnweb 游戏详情界面，显示游戏封面、游玩时长以及角色、OST 和攻略等标签"
          width="1440"
          height="810"
          fetchpriority="high"
        />
      </figure>
    </section>

    <nav class="docs-modules" aria-labelledby="docs-modules-title">
      <h2 id="docs-modules-title">按功能查阅</h2>
      <div class="docs-module-grid">
        <section v-for="module in guideModules" :key="module.text" class="docs-module">
          <h3>
            <svg class="docs-icon" aria-hidden="true" focusable="false">
              <use :href="`${iconSprite}#${module.icon}`" />
            </svg>
            {{ module.text }}
          </h3>
          <ul>
            <li v-for="item in module.items" :key="item.link">
              <a :href="withBase(item.link)">
                {{ item.text }}
                <svg class="docs-icon docs-link-icon" aria-hidden="true" focusable="false">
                  <use :href="`${iconSprite}#arrow-right`" />
                </svg>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </nav>
  </div>
</template>

<style src="./home.css"></style>
