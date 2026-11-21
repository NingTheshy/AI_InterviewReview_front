<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExperienceDetail, getExperienceComments, addComment,
  likeExperience, unlikeExperience, favoriteExperience, unfavoriteExperience } from '@/api/experience'
import { useUserStore } from '@/store/useUserStore'
import UserAvatar from '@/components/UserAvatar.vue'
import ThreadComment from '@/components/ThreadComment.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const experience = ref(null)
const comments = ref([])
const commentText = ref('')
const commentLoading = ref(false)
const commentPagination = reactive({ page: 1, size: 20, total: 0 })
function formatTime(value) { return value ? new Date(value).toLocaleString('zh-CN') : '--' }
async function fetchDetail() {
  loading.value = true
  try {
    experience.value = (await getExperienceDetail(route.params.id)).data
    await fetchComments()
  } finally { loading.value = false }
}
async function fetchComments() {
  const res = await getExperienceComments(route.params.id, { page: commentPagination.page, size: commentPagination.size })
  comments.value = res.data.records
  commentPagination.total = res.data.total
}
async function toggleLike() {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  if (experience.value.liked) await unlikeExperience(route.params.id)
  else await likeExperience(route.params.id)
  experience.value.liked = !experience.value.liked
  experience.value.likeCount += experience.value.liked ? 1 : -1
}
async function toggleFavorite() {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  if (experience.value.favorited) await unfavoriteExperience(route.params.id)
  else await favoriteExperience(route.params.id)
  experience.value.favorited = !experience.value.favorited
  experience.value.favoriteCount += experience.value.favorited ? 1 : -1
}
async function submitComment() {
  if (!commentText.value.trim()) return ElMessage.warning('请输入评论内容')
  commentLoading.value = true
  try {
    await addComment(route.params.id, { content: commentText.value.trim() })
    commentText.value = ''
    commentPagination.page = 1
    await fetchComments()
    ElMessage.success('评论成功')
  } finally { commentLoading.value = false }
}
onMounted(fetchDetail)
</script>

<template>
  <div class="experience-detail" v-loading="loading">
    <template v-if="experience">
      <section class="card hero">
        <h1>{{ experience.title }}</h1>
        <div class="meta"><UserAvatar :size="28" :avatar="experience.authorAvatar" />
          <span>{{ experience.authorNickname || '匿名发布者' }}</span>
          <span>{{ experience.positionTitle }}</span>
          <span>{{ formatTime(experience.publishedAt) }}</span>
        </div>
        <div class="actions">
          <el-button :type="experience.liked ? 'primary' : 'default'" @click="toggleLike">👍 {{ experience.likeCount || 0 }} 点赞</el-button>
          <el-button :type="experience.favorited ? 'warning' : 'default'" @click="toggleFavorite">⭐ {{ experience.favoriteCount || 0 }} 收藏</el-button>
          <span>👁️ {{ experience.viewCount || 0 }} 浏览</span>
        </div>
      </section>
      <section class="card">
        <h2>面试题目（{{ experience.questions?.length || 0 }}）</h2>
        <article v-for="(q, index) in experience.questions" :key="q.id" class="question">
          <h3>{{ index + 1 }}. {{ q.questionText }}</h3>
          <div v-if="q.referenceAnswer" class="answer"><strong>AI 标准答案</strong><p>{{ q.referenceAnswer }}</p></div>
        </article>
      </section>
      <section class="card">
        <h2>评论</h2>
        <div v-if="userStore.isLoggedIn">
          <el-input v-model="commentText" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="写下你的看法" />
          <el-button type="primary" :loading="commentLoading" @click="submitComment">发表评论</el-button>
        </div>
        <el-button v-else link type="primary" @click="router.push('/login')">登录后发表评论</el-button>
        <ThreadComment v-for="item in comments" :key="item.id" :item="item" :experience-id="route.params.id" @deleted="fetchComments" />
      </section>
      <div v-if="commentPagination.total > commentPagination.size" class="pagination-wrapper">
        <el-pagination v-model:current-page="commentPagination.page"
                       :page-size="commentPagination.size" :total="commentPagination.total" layout="prev, pager, next"
                       @current-change="fetchComments" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.experience-detail{flex:1;display:flex;flex-direction:column;width:100%;max-width:960px;margin:28px auto;padding:0 16px 40px;color:#243447}
.pagination-wrapper{display:flex;justify-content:center;margin-top:auto;padding-top:24px;position:sticky;bottom:0;z-index:5;background:#f4f7f8}
.card{background:#fff;border:1px solid #e7edf3;border-radius:14px;padding:26px;margin-bottom:18px;box-shadow:0 7px 25px #22354a08}
h1{font-size:28px;margin:0 0 18px}h2{font-size:20px;margin:0 0 18px}.meta,.actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;color:#718096}.actions{margin-top:22px}
.question{padding:18px 0;border-top:1px solid #edf1f5}.question h3{font-size:17px;margin:0 0 12px;white-space:pre-wrap}.answer{background:#f5f9fb;border-radius:9px;padding:16px;line-height:1.8}.answer p{white-space:pre-wrap;margin:8px 0 0}
</style>
