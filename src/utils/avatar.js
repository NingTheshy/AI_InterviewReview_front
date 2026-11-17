import defaultAvatar from '@/assets/default-avatar.svg'

const localAvatarPattern = /^\/avatars\/[0-9a-f]{32}\.png$/

export { defaultAvatar }

export function avatarUrl(value) {
  if (!localAvatarPattern.test(value || '')) return defaultAvatar
  const apiBase = (import.meta.env.VITE_APP_BASE_API || '').replace(/\/$/, '')
  return `${apiBase}${value}`
}
