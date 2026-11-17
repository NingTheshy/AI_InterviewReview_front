<script setup>
import { ref, watch } from 'vue'
import { avatarUrl, defaultAvatar } from '@/utils/avatar'

const props = defineProps({
  avatar: { type: String, default: '' },
  size: { type: [Number, String], default: 32 },
  alt: { type: String, default: '用户头像' }
})

const source = ref(avatarUrl(props.avatar))
watch(() => props.avatar, value => { source.value = avatarUrl(value) })

function handleError() {
  if (source.value !== defaultAvatar) source.value = defaultAvatar
}
</script>

<template>
  <el-avatar :size="size" :src="source" :alt="alt" @error="handleError">
    <el-icon><UserFilled /></el-icon>
  </el-avatar>
</template>
