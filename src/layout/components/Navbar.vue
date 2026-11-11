<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/useAppStore'
import { useUserStore } from '@/store/useUserStore'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const sidebarOpened = computed(() => appStore.sidebarOpened)
const username = computed(() => userStore.nickname || userStore.username)
const avatar = computed(() => userStore.avatar)

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
        <el-breadcrumb-item :to="{ path: '/management/stats' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.meta?.title">
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
          <el-avatar :size="30" :src="avatar" icon="UserFilled" />
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
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(21, 59, 69, 0.08);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

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
</style>
