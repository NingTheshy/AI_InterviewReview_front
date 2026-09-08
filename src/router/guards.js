import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/useUserStore'
import { usePermissionStore } from '@/store/usePermissionStore'

NProgress.configure({ showSpinner: false })

// 公开页面前缀（无需登录即可访问）
const publicPrefixes = ['/login', '/register', '/share', '/experiences']

function isPublicPath(path) {
  return publicPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))
}

export function setupRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    NProgress.start()
    const hasToken = getToken()

    if (hasToken) {
      const userStore = useUserStore()
      const permissionStore = usePermissionStore()

      // 已登录用户访问登录页时重定向到首页
      if (to.path === '/login') {
        next('/')
        NProgress.done()
        return
      }

      // 如果用户信息已加载且动态路由已生成，直接放行
      if (userStore.userInfo && permissionStore.routesGenerated) {
        // 管理员路径保护：非管理员禁止访问
        if (to.path.startsWith('/admin') && !userStore.isAdmin) {
          next('/404')
          NProgress.done()
          return
        }
        next()
        return
      }

      // 用户信息未加载或动态路由未生成，先获取用户信息并生成路由
      try {
        const userInfo = await userStore.fetchUserInfo()
        // 根据用户角色生成动态路由
        const accessRoutes = await permissionStore.generateRoutes(userInfo.role === 1)
        // 动态添加路由
        accessRoutes.forEach(route => {
          router.addRoute(route)
        })
        permissionStore.markRoutesGenerated()
        // 重新导航以匹配新添加的路由
        next({ ...to, replace: true })
      } catch (error) {
        // 获取用户信息失败（token 无效等），清除登录状态
        console.error('获取用户信息失败:', error)
        await userStore.reset()
        next('/login')
      }
    } else {
      // 未登录用户：公开页面放行，其他重定向到登录页
      if (isPublicPath(to.path)) {
        next()
      } else {
        next('/login')
      }
    }
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
