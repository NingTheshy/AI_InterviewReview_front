import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/useUserStore'
import { usePermissionStore } from '@/store/usePermissionStore'

NProgress.configure({ showSpinner: false })

// 公开页面前缀（无需登录即可访问）
const publicPrefixes = ['/login', '/register', '/experiences']

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
        next(to.matched.length > 0 ? undefined : '/404')
        return
      }

      // 用户信息未加载或动态路由未生成，先获取用户信息并生成路由
      try {
        const userInfo = await userStore.fetchUserInfo()
        // 根据 profile 返回的角色和权限生成动态路由
        const accessRoutes = permissionStore.generateRoutes(userInfo)
        // 通配 404 必须最后注册，否则首次登录时动态路由会被它提前捕获。
        if (router.hasRoute('NotFoundCatchAll')) {
          router.removeRoute('NotFoundCatchAll')
        }
        accessRoutes.forEach(route => {
          router.addRoute(route)
        })
        router.addRoute({
          path: '/:pathMatch(.*)*',
          name: 'NotFoundCatchAll',
          redirect: '/404'
        })
        permissionStore.markRoutesGenerated()
        // 重新按原始 URL 匹配新添加的路由。此时 `to` 可能已经被通配
        // 404 路由解析，展开该对象会保留 `name: 'NotFound'`，从而再次跳到 404。
        next({ path: to.path, query: to.query, hash: to.hash, replace: true })
      } catch (error) {
        // 获取用户信息失败（token 无效等），清除登录状态
        console.error('获取用户信息失败:', error)
        await userStore.reset()
        next('/login')
      }
    } else {
      // 未登录用户：公开页面放行，其他重定向到登录页
      if (isPublicPath(to.path)) {
        next(to.matched.length > 0 ? undefined : '/404')
      } else {
        next('/login')
      }
    }
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
