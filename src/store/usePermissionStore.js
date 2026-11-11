import { ref } from 'vue'
import { defineStore } from 'pinia'
import { constantRoutes } from '@/router'

export const usePermissionStore = defineStore('permission', () => {
  // State
  const routes = ref([])
  const addRoutes = ref([])
  const routesGenerated = ref(false)

  // 后端 profile 返回的权限码是前端可见性判断的唯一数据来源。
  function filterRoutesByAccess(routeList, userInfo) {
    const roles = userInfo?.roles || []
    const permissions = userInfo?.permissions || []

    return routeList.reduce((result, route) => {
      const requiredRoles = route.meta?.roles || []
      const requiredPermissions = route.meta?.permissions || []
      const roleAllowed = requiredRoles.length === 0 || requiredRoles.some(role => roles.includes(role))
      const permissionAllowed = requiredPermissions.length === 0
        || requiredPermissions.some(permission => permissions.includes(permission))
      if (!roleAllowed || !permissionAllowed) return result

      const nextRoute = { ...route }
      if (route.children) {
        nextRoute.children = filterRoutesByAccess(route.children, userInfo)
        if (nextRoute.children.length === 0) return result
      }
      result.push(nextRoute)
      return result
    }, [])
  }

  // Actions
  function generateRoutes(userInfo = {}) {
    const allRoutes = [
      {
        path: '/',
        component: () => import('@/layout/UserLayout.vue'),
        redirect: '/interviews',
        children: [
          {
            path: 'interviews',
            name: 'InterviewList',
            component: () => import('@/views/interview/index.vue'),
            meta: { title: '面试列表', icon: 'List', permissions: ['interview:read'] }
          },
          {
            path: 'interview/upload',
            name: 'InterviewUpload',
            component: () => import('@/views/interview/upload.vue'),
            meta: { title: '创建面试', icon: 'Upload', permissions: ['interview:create'] }
          },
          {
            path: 'interview/:id',
            name: 'InterviewDetail',
            component: () => import('@/views/interview/detail.vue'),
            meta: { title: '面试详情', icon: 'View', hidden: true, permissions: ['interview:read'] }
          },
          {
            path: 'favorites',
            name: 'Favorites',
            component: () => import('@/views/favorites/index.vue'),
            meta: { title: '我的收藏', icon: 'Star', permissions: ['favorite:manage'] }
          },
          {
            path: 'profile',
            name: 'Profile',
            component: () => import('@/views/profile/index.vue'),
            meta: { title: '个人信息', icon: 'User', hidden: true }
          }
        ]
      },
      // 管理员路由
      {
        path: '/management',
        component: () => import('@/layout/index.vue'),
        redirect: '/management/users',
        meta: { title: '管理中心', icon: 'Tools' },
        children: [
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('@/views/admin/users.vue'),
            meta: { title: '用户管理', icon: 'UserFilled', permissions: ['user:read'] }
          },
          {
            path: 'interviews',
            name: 'AdminInterviews',
            component: () => import('@/views/admin/interviews.vue'),
            meta: { title: '面试管理', icon: 'Document', permissions: ['interview:read_all'] }
          },
          {
            path: 'experiences',
            name: 'AdminExperiences',
            component: () => import('@/views/admin/experiences.vue'),
            meta: { title: '经验管理', icon: 'ChatDotRound', permissions: ['experience:read_all'] }
          },
          {
            path: 'comments',
            name: 'AdminComments',
            component: () => import('@/views/admin/comments.vue'),
            meta: { title: '评论管理', icon: 'ChatLineRound', permissions: ['comment:read_all'] }
          },
          {
            path: 'ai-config',
            name: 'AiConfig',
            component: () => import('@/views/admin/aiConfig.vue'),
            meta: { title: 'AI配置', icon: 'Setting', permissions: ['ai_config:read'] }
          },
          {
            path: 'stats',
            name: 'AdminStats',
            component: () => import('@/views/admin/stats.vue'),
            meta: { title: '系统统计', icon: 'DataAnalysis', permissions: ['system:stats:read'] }
          },
          {
            path: 'audit-logs',
            name: 'AdminAuditLogs',
            component: () => import('@/views/admin/auditLogs.vue'),
            meta: { title: '审计日志', icon: 'Tickets', permissions: ['audit:read'] }
          }
        ]
      }
    ]

    const accessedRoutes = filterRoutesByAccess(allRoutes, userInfo)
    addRoutes.value = accessedRoutes
    routes.value = constantRoutes.concat(accessedRoutes)
    return accessedRoutes
  }

  function markRoutesGenerated() {
    routesGenerated.value = true
  }

  function resetRoutes(router) {
    const removeRouteTree = routeList => {
      routeList.forEach(route => {
        route.children && removeRouteTree(route.children)
        if (route.name && router?.hasRoute(route.name)) {
          router.removeRoute(route.name)
        }
      })
    }
    removeRouteTree(addRoutes.value)
    if (router?.hasRoute('NotFoundCatchAll')) {
      router.removeRoute('NotFoundCatchAll')
    }
    routes.value = []
    addRoutes.value = []
    routesGenerated.value = false
  }

  return {
    routes, addRoutes, routesGenerated,
    generateRoutes, resetRoutes, markRoutesGenerated
  }
})
