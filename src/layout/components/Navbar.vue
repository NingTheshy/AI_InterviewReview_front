<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'
import { usePermissionStore } from '@/store/usePermissionStore'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const sidebarOpened = computed(() => appStore.sidebarOpened)
const username = computed(() => userStore.nickname || userStore.username)
const avatar = computed(() => userStore.avatar)
const homeRoute = computed(() => {
  const children = permissionStore.routes.find(item => item.path === '/management')?.children || []
  const first = children.find(item => item.path === 'stats') || children.find(item => !item.meta?.hidden)
  return first ? { path: `/management/${first.path}`, title: first.meta?.title } : { path: '/', title: '首页' }
})

function toggleSidebar() {
  appStore.toggleSidebar()
}

function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      userStore.logout()
      break
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="hamburger" @click="toggleSidebar">
        <Fold v-if="sidebarOpened" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: homeRoute.path }">{{ homeRoute.title }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.meta?.title && route.path !== homeRoute.path">
          {{ route.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="navbar-right">
      <el-tooltip content="返回前台" placement="bottom">
        <el-icon class="navbar-action" @click="router.push('/')"><HomeFilled /></el-icon>
      </el-tooltip>
      <el-tooltip content="全屏" placement="bottom">
        <el-icon class="navbar-action" @click="toggleFullscreen"><FullScreen /></el-icon>
      </el-tooltip>
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <UserAvatar :size="30" :avatar="avatar" />
          <span class="username">{{ username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: #fff;
  border-bottom: 1px solid #e8edf1;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.navbar-right { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }

.hamburger {
  font-size: 20px;
  cursor: pointer;
  color: #42616a;
}

.hamburger:hover {
  color: #0f7490;
}

.navbar-action {
  font-size: 18px;
  color: #42616a;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.navbar-action:hover {
  color: #0f7490;
  background: #eaf6f6;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 999px;
  transition: background .2s ease;
}

.user-info:hover {
  background: #eef6f7;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #35565f;
}
@media (max-width: 768px) {
  .navbar { padding: 0 14px; }
  .navbar-right { display: flex; align-items: center; }
  .username { display: none; }
}
</style>
