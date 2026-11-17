<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const key = computed(() => route.path)
</script>

<template>
  <section class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive>
          <component :is="Component" :key="key" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<style scoped>
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 22px 24px;
  background: #f5f7fa;
  min-height: 0;
}

@media (max-width: 768px) {
  .app-main { padding: 14px; }
}
</style>
