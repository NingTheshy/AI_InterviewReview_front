<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserAvatar from '@/components/UserAvatar.vue'
import { addComment, deleteComment, getCommentReplies } from '@/api/experience'
import { useUserStore } from '@/store/useUserStore'

defineOptions({ name: 'ThreadComment' })
const props = defineProps({ item: { type: Object, required: true }, experienceId: { type: [String, Number], required: true }, depth: { type: Number, default: 0 } })
const emit = defineEmits(['deleted'])
const router = useRouter()
const userStore = useUserStore()
const replies = ref([])
const replyTotal = ref(Number(props.item.replyCount || 0))
const replyPage = ref(1)
const expanded = ref(false)
const loading = ref(false)
const replying = ref(false)
const replyText = ref('')
const sending = ref(false)
const canDelete = computed(() => userStore.userInfo &&
  (Number(userStore.userInfo.id) === Number(props.item.userId) || userStore.isAdmin))
function formatTime(value) { return value ? new Date(value).toLocaleString('zh-CN') : '--' }
async function loadReplies(page = replyPage.value, append = false) {
  loading.value = true
  try {
    const result = await getCommentReplies(props.experienceId, props.item.id, { page, size: 10 })
    replies.value = append ? [...replies.value, ...result.data.records] : result.data.records
    replyTotal.value = result.data.total
    replyPage.value = page
  } finally { loading.value = false }
}
async function toggleReplies() {
  expanded.value = !expanded.value
  if (expanded.value) await loadReplies(1)
}
async function loadMoreReplies() { await loadReplies(replyPage.value + 1, true) }
function openReply() {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  replying.value = !replying.value
}
async function submitReply() {
  if (!replyText.value.trim()) return ElMessage.warning('请输入回复内容')
  sending.value = true
  try {
    await addComment(props.experienceId, { content: replyText.value.trim(), parentId: props.item.id })
    replyText.value = ''
    replying.value = false
    expanded.value = true
    await loadReplies(1)
    ElMessage.success('回复成功')
  } finally { sending.value = false }
}
async function removeComment() {
  await ElMessageBox.confirm('删除后这条评论及其全部回复都将隐藏。确定删除吗？', '删除评论', { type: 'warning' })
  await deleteComment(props.item.id)
  emit('deleted')
  ElMessage.success('删除成功')
}
</script>

<template>
  <div class="thread-comment" :style="{ marginLeft: `${Math.min(depth, 3) * 18}px` }">
    <div class="comment-main">
      <UserAvatar :size="32" :avatar="item.avatar" />
      <div class="comment-body">
        <div class="comment-heading">
          <strong>{{ item.nickname || '匿名用户' }}</strong>
          <span v-if="item.parentId && item.replyToNickname" class="reply-target">回复 {{ item.replyToNickname }}</span>
          <small>{{ formatTime(item.createdAt) }}</small>
        </div>
        <p>{{ item.content }}</p>
        <div class="comment-actions">
          <el-button link type="primary" @click="openReply">回复</el-button>
          <el-button v-if="canDelete" link type="danger" @click="removeComment">删除</el-button>
          <el-button v-if="replyTotal" link type="primary" @click="toggleReplies">
            {{ expanded ? '收起回复' : `查看回复（${replyTotal}）` }}
          </el-button>
        </div>
        <div v-if="replying" class="reply-editor">
          <el-input v-model="replyText" type="textarea" :rows="2" maxlength="500" show-word-limit :placeholder="`回复 ${item.nickname || '评论者'}`" />
          <el-button type="primary" :loading="sending" @click="submitReply">发表回复</el-button>
        </div>
      </div>
    </div>
    <div v-if="expanded" v-loading="loading" class="replies">
      <ThreadComment v-for="reply in replies" :key="reply.id" :item="reply" :experience-id="experienceId" :depth="depth + 1" @deleted="loadReplies(1)" />
      <el-button v-if="replies.length < replyTotal" link type="primary" @click="loadMoreReplies">加载更多回复</el-button>
    </div>
  </div>
</template>

<style scoped>
.thread-comment{padding:14px 0;border-bottom:1px solid #edf1f5;min-width:0}
.comment-main{display:flex;gap:12px}.comment-body{flex:1;min-width:0}
.comment-heading{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.comment-heading small,.reply-target{color:#909eaa}
.comment-body p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}
.comment-actions{display:flex;gap:8px;flex-wrap:wrap}.reply-editor{margin-top:12px}.reply-editor .el-button{margin-top:8px}
.replies{min-height:24px}
</style>
