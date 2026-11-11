import { useUserStore } from '@/store/useUserStore'

/**
 * v-permission 权限指令
 * 用法: v-permission="['user:read']" 或 v-permission="'ai_config:manage'"
 */
export default {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()

    if (value && value.length > 0) {
      const permissions = Array.isArray(value) ? value : [value]
      const hasPermission = userStore.hasAnyPermission(permissions)

      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  }
}
