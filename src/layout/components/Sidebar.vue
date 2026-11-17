<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/useAppStore'
import { usePermissionStore } from '@/store/usePermissionStore'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const sidebarOpened = computed(() => appStore.sidebarOpened)
const activeMenu = computed(() => route.path)
const adminRoutes = computed(() => permissionStore.routes.find(item => item.path === '/management')?.children?.filter(item => !item.meta?.hidden) || [])
const dashboardRoute = computed(() => adminRoutes.value.find(item => item.path === 'stats'))
const managementRoutes = computed(() => adminRoutes.value.filter(item => item.path !== 'stats'))

function handleMenuSelect(index) {
  router.push(index)
  if (window.matchMedia('(max-width: 768px)').matches) appStore.closeSidebar()
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed: !sidebarOpened }">
    <div class="sidebar-logo">
      <img src="@/assets/logo.svg" alt="logo" class="logo-img" />
      <div v-show="sidebarOpened" class="logo-copy">
        <span class="logo-title">AI 面试复盘</span>
        <span class="logo-caption">管理工作台</span>
      </div>
    </div>
    <el-scrollbar class="sidebar-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="!sidebarOpened"
        :collapse-transition="false"
        @select="handleMenuSelect"
      >
        <div v-if="sidebarOpened && dashboardRoute" class="menu-section">工作台</div>
        <el-menu-item v-if="dashboardRoute" :index="`/management/${dashboardRoute.path}`">
          <el-icon><component :is="dashboardRoute.meta?.icon" /></el-icon>
          <template #title>{{ dashboardRoute.meta?.title }}</template>
        </el-menu-item>
        <div v-if="sidebarOpened && managementRoutes.length" class="menu-section menu-section-spaced">业务管理</div>
        <div v-else-if="managementRoutes.length" class="menu-divider" />
        <el-menu-item v-for="item in managementRoutes" :key="item.path" :index="`/management/${item.path}`">
          <el-icon><component :is="item.meta?.icon" /></el-icon>
          <template #title>{{ item.meta?.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
    <div v-show="sidebarOpened" class="sidebar-footer">AI INTERVIEW REVIEW <span>·</span> ADMIN</div>
  </div>
</template>

<style scoped>
.sidebar {
  height: 100%;
  background: #182c3b;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 11px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.sidebar.collapsed .sidebar-logo { justify-content: center; padding: 0; }

.logo-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.logo-title {
  color: #fff;
  font-size: 14px;
  font-weight: 650;
  white-space: nowrap;
}
.logo-caption { color: #8ea6b5; font-size: 10px; letter-spacing: 0.13em; }
.sidebar-scroll { flex: 1; min-height: 0; }
.menu-section { padding: 23px 22px 7px; color: #7992a2; font-size: 11px; font-weight: 600; letter-spacing: .08em; }
.menu-section-spaced { padding-top: 21px; }
.menu-divider { height: 1px; margin: 12px 15px; background: rgba(255, 255, 255, .1); }
.sidebar-footer { padding: 16px 20px; color: #698492; font-size: 9px; letter-spacing: .08em; white-space: nowrap; }
.sidebar-footer span { color: #35b7ad; }

.el-menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item) {
  height: 42px;
  line-height: 42px;
  margin: 2px 10px;
  width: auto;
  border-radius: 6px;
  color: #b6c7d1;
  font-size: 13px;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.07) !important;
  color: #fff;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(41, 166, 164, 0.18) !important;
  color: #79e2d6 !important;
  font-weight: 600;
}
:deep(.el-menu-item.is-active)::before { content: ''; position: absolute; left: 0; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: #49cbbd; }
:deep(.el-menu--collapse .el-menu-item) { justify-content: center; padding: 0 !important; }
</style>
