import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'

// 静态路由（无需登录即可访问）
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册', hidden: true }
  },
  {
    path: '/share/:token',
    name: 'SharePage',
    component: () => import('@/views/share/index.vue'),
    meta: { title: '分享页', hidden: true }
  },
  // 经验广场公开页面（无需登录）
  {
    path: '/experiences',
    name: 'PublicExperiences',
    component: () => import('@/layout/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'ExperienceSquare',
        component: () => import('@/views/experience/index.vue'),
        meta: { title: '经验广场', hidden: true }
      },
      {
        path: ':token',
        name: 'ExperienceDetailPublic',
        component: () => import('@/views/experience/detail.vue'),
        meta: { title: '经验详情', hidden: true }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

// 安装路由守卫
setupRouterGuards(router)

export default router
