<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/useAppStore'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'
import TagsView from './components/TagsView.vue'

const appStore = useAppStore()
const sidebarOpened = computed(() => appStore.sidebarOpened)

function handleOverlayClick() {
  appStore.closeSidebar()
}
</script>

<template>
  <div class="app-wrapper" :class="{ 'sidebar-collapsed': !sidebarOpened }">
    <!-- 移动端遮罩层 -->
    <div
      v-if="sidebarOpened"
      class="drawer-bg"
      @click="handleOverlayClick"
    />
    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <Navbar />
      <TagsView />
      <AppMain />
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.sidebar-container {
  flex-shrink: 0;
  width: 210px;
  height: 100vh;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(.2,.8,.2,1);
  box-shadow: 5px 0 24px rgba(7, 35, 43, 0.08);
}

.sidebar-collapsed .sidebar-container {
  width: 64px;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: #f4f7f8;
}

.drawer-bg {
  display: none;
}

@media screen and (max-width: 768px) {
  .drawer-bg {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    opacity: 0.3;
    z-index: 999;
  }
}
</style>
