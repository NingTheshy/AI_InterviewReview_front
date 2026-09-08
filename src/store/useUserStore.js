import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, getProfile } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { usePermissionStore } from '@/store/usePermissionStore'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(getToken())
  const userInfo = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const nickname = computed(() => userInfo.value?.nickname || '')
  const avatar = computed(() => userInfo.value?.avatar || '')
  const role = computed(() => userInfo.value?.role ?? 0)
  const isAdmin = computed(() => role.value === 1)

  // Actions
  async function login(loginData) {
    const res = await loginApi(loginData)
    const { token: newToken, user } = res.data
    token.value = newToken
    userInfo.value = user
    setToken(newToken)
    return res
  }

  async function fetchUserInfo() {
    const res = await getProfile()
    userInfo.value = res.data
    return res.data
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      // 即使后端登出失败，前端也清除状态
    }
    reset()
    router.push('/login')
  }

  function reset() {
    token.value = null
    userInfo.value = null
    removeToken()
    // 清理动态路由
    const permissionStore = usePermissionStore()
    permissionStore.resetRoutes()
  }

  return {
    token, userInfo,
    isLoggedIn, username, nickname, avatar, role, isAdmin,
    login, fetchUserInfo, logout, reset
  }
})
