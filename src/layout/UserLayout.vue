<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/useUserStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const username = computed(() => userStore.nickname || userStore.username)
const avatar = computed(() => userStore.avatar)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const navLinks = [
  { path: '/interviews', label: '我的面试' },
  { path: '/interview/upload', label: '上传面试' },
  { path: '/experiences', label: '经验广场' },
  { path: '/favorites', label: '我的收藏' }
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function handleNav(path) {
  router.push(path)
}

function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      router.push('/admin')
      break
    case 'logout':
      userStore.logout()
      break
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="user-layout">
    <!-- 顶部导航 -->
    <header class="top-nav">
      <div class="nav-inner">
        <div class="nav-left">
          <div class="logo" @click="router.push('/interviews')">
            <span class="logo-icon">🎯</span>
            <span class="logo-text">AI 面试复盘</span>
          </div>
          <nav class="nav-links">
            <a
              v-for="link in navLinks"
              :key="link.path"
              :class="['nav-link', { active: isActive(link.path) }]"
              @click="handleNav(link.path)"
            >
              {{ link.label }}
            </a>
          </nav>
        </div>
        <div class="nav-right">
          <template v-if="isLoggedIn">
            <el-dropdown @command="handleCommand" trigger="click">
              <div class="user-avatar">
                <el-avatar :size="32" :src="avatar" icon="UserFilled" />
                <span class="user-name">{{ username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin">管理后台</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" round @click="goLogin">登录</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 -->
    <footer class="site-footer">
      <p>© {{ new Date().getFullYear() }} AI 面试复盘系统 — 让每一次面试都有价值</p>
    </footer>
  </div>
</template>

<style scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 顶部导航 */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.06);
}

.nav-link.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-avatar:hover {
  background: rgba(0, 0, 0, 0.04);
}

.user-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 内容区 */
.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

/* 底部 */
.site-footer {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 13px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
