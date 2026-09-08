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
const routes = computed(() => permissionStore.routes)

function handleMenuSelect(index) {
  router.push(index)
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-logo">
      <img src="@/assets/logo.svg" alt="logo" class="logo-img" />
      <span v-show="sidebarOpened" class="logo-title">AI面试复盘</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="!sidebarOpened"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        @select="handleMenuSelect"
      >
        <template v-for="route in routes" :key="route.path">
          <!-- 单个菜单项（无子路由或只有一个子路由） -->
          <template v-if="!route.children || route.children.length === 0">
            <el-menu-item :index="route.path" v-if="!route.meta?.hidden">
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
          </template>

          <!-- 只有一个可见子路由时，直接显示子路由 -->
          <template v-else-if="route.children.filter(c => !c.meta?.hidden).length === 1">
            <el-menu-item
              :index="route.path + '/' + route.children.filter(c => !c.meta?.hidden)[0].path"
              v-if="!route.meta?.hidden"
            >
              <el-icon v-if="route.children.filter(c => !c.meta?.hidden)[0].meta?.icon">
                <component :is="route.children.filter(c => !c.meta?.hidden)[0].meta.icon" />
              </el-icon>
              <template #title>{{ route.children.filter(c => !c.meta?.hidden)[0].meta?.title }}</template>
            </el-menu-item>
          </template>

          <!-- 多个子路由时，显示折叠菜单 -->
          <el-sub-menu v-else :index="route.path" v-if="!route.meta?.hidden">
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children.filter(c => !c.meta?.hidden)"
              :key="child.path"
              :index="route.path + '/' + child.path"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.sidebar {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: #2b2f3a;
  overflow: hidden;
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-title {
  margin-left: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
  border-right: 3px solid #409eff;
}
</style>
