import { useUserStore } from '@/store/useUserStore'

/**
 * v-permission 权限指令
 * 用法: v-permission="['user:list']" 或 v-permission="'user:manage'"
 */
export default {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()

    if (value && value.length > 0) {
      const permissions = Array.isArray(value) ? value : [value]
      // admin 角色拥有所有权限
      const hasPermission = userStore.isAdmin || permissions.some(p => {
        // TODO: 从用户信息中获取权限列表进行匹配
        // 目前仅通过角色判断
        return false
      })

      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  }
}
