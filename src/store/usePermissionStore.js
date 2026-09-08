import { ref } from 'vue'
import { defineStore } from 'pinia'
import { constantRoutes } from '@/router'

export const usePermissionStore = defineStore('permission', () => {
  // State
  const routes = ref([])
  const addRoutes = ref([])
  const routesGenerated = ref(false)

  // 根据角色过滤路由
  function filterRoutesByRole(routes, isAdmin) {
    return routes.filter(route => {
      if (route.meta?.roles && route.meta.roles.length > 0) {
        return isAdmin
      }
      return true
    }).map(route => {
      if (route.children) {
        return {
          ...route,
          children: filterRoutesByRole(route.children, isAdmin)
        }
      }
      return route
    })
  }

  // Actions
  function generateRoutes(isAdmin = false) {
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
            meta: { title: '面试列表', icon: 'List' }
          },
          {
            path: 'interview/upload',
            name: 'InterviewUpload',
            component: () => import('@/views/interview/upload.vue'),
            meta: { title: '上传面试', icon: 'Upload' }
          },
          {
            path: 'interview/:id',
            name: 'InterviewDetail',
            component: () => import('@/views/interview/detail.vue'),
            meta: { title: '面试详情', icon: 'View', hidden: true }
          },
          {
            path: 'favorites',
            name: 'Favorites',
            component: () => import('@/views/favorites/index.vue'),
            meta: { title: '我的收藏', icon: 'Star' }
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
        path: '/admin',
        component: () => import('@/layout/index.vue'),
        redirect: '/admin/users',
        meta: { roles: ['admin'] },
        children: [
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('@/views/admin/users.vue'),
            meta: { title: '用户管理', icon: 'UserFilled', roles: ['admin'] }
          },
          {
            path: 'interviews',
            name: 'AdminInterviews',
            component: () => import('@/views/admin/interviews.vue'),
            meta: { title: '面试管理', icon: 'Document', roles: ['admin'] }
          },
          {
            path: 'experiences',
            name: 'AdminExperiences',
            component: () => import('@/views/admin/experiences.vue'),
            meta: { title: '经验管理', icon: 'ChatDotRound', roles: ['admin'] }
          },
          {
            path: 'comments',
            name: 'AdminComments',
            component: () => import('@/views/admin/comments.vue'),
            meta: { title: '评论管理', icon: 'ChatLineRound', roles: ['admin'] }
          },
          {
            path: 'ai-config',
            name: 'AiConfig',
            component: () => import('@/views/admin/aiConfig.vue'),
            meta: { title: 'AI配置', icon: 'Setting', roles: ['admin'] }
          },
          {
            path: 'stats',
            name: 'AdminStats',
            component: () => import('@/views/admin/stats.vue'),
            meta: { title: '系统统计', icon: 'DataAnalysis', roles: ['admin'] }
          }
        ]
      }
    ]

    const accessedRoutes = filterRoutesByRole(allRoutes, isAdmin)
    addRoutes.value = accessedRoutes
    routes.value = constantRoutes.concat(accessedRoutes)
    return accessedRoutes
  }

  function markRoutesGenerated() {
    routesGenerated.value = true
  }

  function resetRoutes() {
    routes.value = []
    addRoutes.value = []
    routesGenerated.value = false
  }

  return {
    routes, addRoutes, routesGenerated,
    generateRoutes, resetRoutes, markRoutesGenerated
  }
})
