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
      router.push('/management')
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
  background:
    radial-gradient(circle at 12% -10%, rgba(91, 196, 194, 0.16), transparent 28rem),
    #f4f7f8;
}

/* 顶部导航 */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(21, 59, 69, 0.08);
  box-shadow: 0 4px 18px rgba(21, 59, 69, 0.05);
}

.nav-inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 46px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  font-size: 18px;
  background: linear-gradient(135deg, #0d718d, #1ca3a7);
  border-radius: 11px;
  box-shadow: 0 6px 14px rgba(15, 116, 144, 0.2);
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #0b5d73, #13858b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: #587078;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #0d718d;
  background: rgba(15, 116, 144, 0.07);
}

.nav-link.active {
  color: #0d718d;
  background: #e6f4f5;
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
  border-radius: 999px;
  transition: background 0.2s;
}

.user-avatar:hover {
  background: #eef6f7;
}

.user-name {
  font-size: 14px;
  color: #28464e;
  font-weight: 500;
}

/* 内容区 */
.main-content {
  flex: 1;
  max-width: 1240px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 40px;
}

/* 底部 */
.site-footer {
  text-align: center;
  padding: 20px;
  color: #72878d;
  font-size: 13px;
  border-top: 1px solid rgba(21, 59, 69, 0.08);
  background: rgba(255, 255, 255, 0.74);
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

@media (max-width: 760px) {
  .nav-inner { height: 60px; padding: 0 16px; }
  .nav-left { gap: 0; }
  .logo-text, .nav-links, .user-name { display: none; }
  .main-content { padding: 20px 16px 28px; }
}
</style>
