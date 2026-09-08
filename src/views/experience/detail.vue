<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExperienceDetail, getExperienceComments, addComment, deleteComment } from '@/api/experience'
import { useUserStore } from '@/store/useUserStore'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(true)
const experience = ref(null)

// 评论
const comments = ref([])
const commentLoading = ref(false)
const commentText = ref('')
const commentPagination = reactive({ page: 1, size: 20, total: 0 })

const interviewTypeMap = {
  coding: '技术面',
  behavioral: '行为面',
  system_design: '系统设计',
  comprehensive: '综合'
}

function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

function getScoreLabel(score) {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '待提升'
}

function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getExperienceDetail(route.params.token)
    experience.value = res.data
    fetchComments()
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

async function fetchComments() {
  try {
    const res = await getExperienceComments(route.params.token, {
      page: commentPagination.page,
      size: commentPagination.size
    })
    comments.value = res.data.records
    commentPagination.total = res.data.total
  } catch (error) {
    // 忽略
  }
}

async function handleAddComment() {
  if (!commentText.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commentLoading.value = true
  try {
    await addComment(route.params.token, { content: commentText.value.trim() })
    ElMessage.success('评论成功')
    commentText.value = ''
    commentPagination.page = 1
    fetchComments()
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    commentLoading.value = false
  }
}

async function handleDeleteComment(comment) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteComment(comment.id)
    ElMessage.success('已删除')
    fetchComments()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

function handleCommentPageChange(page) {
  commentPagination.page = page
  fetchComments()
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="experience-detail" v-loading="loading">
    <template v-if="experience">
      <!-- 顶部信息卡片 -->
      <div class="hero-card">
        <div class="hero-info">
          <div class="hero-tags">
            <el-tag v-if="experience.interviewType" effect="plain" round size="small">
              {{ interviewTypeMap[experience.interviewType] || experience.interviewType }}
            </el-tag>
          </div>
          <h1 class="hero-title">{{ experience.title || '经验详情' }}</h1>
          <div class="hero-meta">
            <span v-if="experience.companyName">{{ experience.companyName }}</span>
            <span v-if="experience.positionTitle">{{ experience.positionTitle }}</span>
            <span v-if="experience.industry">{{ experience.industry }}</span>
            <span>👁️ {{ experience.viewCount || 0 }} 浏览</span>
            <span>{{ formatTime(experience.createdAt) }}</span>
          </div>
        </div>
        <div class="hero-score" v-if="experience.overallScore != null">
          <div class="big-score" :style="{ color: getScoreColor(experience.overallScore) }">
            {{ experience.overallScore }}
          </div>
          <div class="score-desc" :style="{ color: getScoreColor(experience.overallScore) }">
            {{ getScoreLabel(experience.overallScore) }}
          </div>
        </div>
      </div>

      <!-- 维度评分 -->
      <div class="section-card" v-if="experience.overallScore != null">
        <h3 class="section-title">📊 评分维度</h3>
        <div class="dimension-grid">
          <div class="dimension-card">
            <el-progress type="circle" :percentage="experience.dimensionContent || 0" :color="getScoreColor(experience.dimensionContent)" :width="80" :stroke-width="6" />
            <span class="dimension-name">内容质量</span>
          </div>
          <div class="dimension-card">
            <el-progress type="circle" :percentage="experience.dimensionLogic || 0" :color="getScoreColor(experience.dimensionLogic)" :width="80" :stroke-width="6" />
            <span class="dimension-name">逻辑性</span>
          </div>
          <div class="dimension-card">
            <el-progress type="circle" :percentage="experience.dimensionExpression || 0" :color="getScoreColor(experience.dimensionExpression)" :width="80" :stroke-width="6" />
            <span class="dimension-name">表达能力</span>
          </div>
          <div class="dimension-card">
            <el-progress type="circle" :percentage="experience.dimensionProfessional || 0" :color="getScoreColor(experience.dimensionProfessional)" :width="80" :stroke-width="6" />
            <span class="dimension-name">专业度</span>
          </div>
          <div class="dimension-card">
            <el-progress type="circle" :percentage="experience.dimensionCommunication || 0" :color="getScoreColor(experience.dimensionCommunication)" :width="80" :stroke-width="6" />
            <span class="dimension-name">沟通能力</span>
          </div>
        </div>
      </div>

      <!-- AI 建议 -->
      <div class="section-card" v-if="experience.improvementSummary || experience.strengths || experience.weaknesses">
        <h3 class="section-title">💡 AI 改进建议</h3>
        <div class="suggestion-grid">
          <div class="suggestion-card strengths" v-if="experience.strengths">
            <div class="suggestion-header">
              <span class="suggestion-icon">✅</span>
              <span>优势</span>
            </div>
            <p>{{ experience.strengths }}</p>
          </div>
          <div class="suggestion-card weaknesses" v-if="experience.weaknesses">
            <div class="suggestion-header">
              <span class="suggestion-icon">⚠️</span>
              <span>不足</span>
            </div>
            <p>{{ experience.weaknesses }}</p>
          </div>
          <div class="suggestion-card summary" v-if="experience.improvementSummary">
            <div class="suggestion-header">
              <span class="suggestion-icon">📝</span>
              <span>总结</span>
            </div>
            <p>{{ experience.improvementSummary }}</p>
          </div>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="section-card" v-if="experience.questions && experience.questions.length > 0">
        <h3 class="section-title">📋 题目评分（{{ experience.questions.length }} 题）</h3>
        <el-collapse>
          <el-collapse-item
            v-for="q in experience.questions"
            :key="q.id"
            :name="q.id"
          >
            <template #title>
              <div class="question-header">
                <span class="question-index">第 {{ q.questionIndex }} 题</span>
                <span class="question-score" :style="{ color: getScoreColor(q.score) }">
                  {{ q.score }} 分
                </span>
              </div>
            </template>
            <div class="question-content">
              <div class="question-section">
                <h4>题目</h4>
                <p>{{ q.questionText }}</p>
              </div>
              <div class="question-section tip" v-if="q.improvementTip">
                <h4>💡 改进建议</h4>
                <p>{{ q.improvementTip }}</p>
              </div>
              <div class="question-section ref" v-if="q.referenceAnswer">
                <h4>📖 参考答案</h4>
                <p>{{ q.referenceAnswer }}</p>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 评论区 -->
      <div class="section-card">
        <h3 class="section-title">💬 评论（{{ commentPagination.total }}）</h3>

        <!-- 发表评论 -->
        <div class="comment-input" v-if="userStore.isLoggedIn">
          <el-input
            v-model="commentText"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="分享你的看法..."
          />
          <el-button type="primary" style="margin-top: 8px;" :loading="commentLoading" @click="handleAddComment">
            发表评论
          </el-button>
        </div>
        <div v-else class="login-tip">
          <el-link type="primary" href="/login">登录</el-link>后可发表评论
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-for="item in comments" :key="item.id" class="comment-item">
            <div class="comment-avatar">
              <el-avatar :size="36" icon="UserFilled" />
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-user">{{ item.nickname || item.username || '匿名用户' }}</span>
                <span class="comment-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <div class="comment-text">{{ item.content }}</div>
              <div class="comment-actions" v-if="userStore.userInfo && (userStore.userInfo.id === item.userId || userStore.userInfo.id === experience.userId || userStore.isAdmin)">
                <el-button type="danger" link size="small" @click="handleDeleteComment(item)">删除</el-button>
              </div>
            </div>
          </div>
          <el-empty v-if="comments.length === 0" description="暂无评论" :image-size="80" />
        </div>

        <!-- 评论分页 -->
        <div class="pagination-wrapper" v-if="commentPagination.total > commentPagination.size">
          <el-pagination
            v-model:current-page="commentPagination.page"
            :page-size="commentPagination.size"
            :total="commentPagination.total"
            layout="prev, pager, next"
            @current-change="handleCommentPageChange"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.experience-detail {
  padding-bottom: 40px;
}

/* 顶部信息卡片 */
.hero-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 16px;
  padding: 32px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.hero-info {
  flex: 1;
}

.hero-tags {
  margin-bottom: 10px;
}

.hero-tags .el-tag {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.hero-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
}

.hero-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: 0.85;
  flex-wrap: wrap;
}

.hero-score {
  text-align: center;
  min-width: 100px;
}

.big-score {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.score-desc {
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

/* 区域卡片 */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-title {
  margin: 0 0 20px;
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

/* 维度评分 */
.dimension-grid {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 16px;
}

.dimension-card {
  text-align: center;
}

.dimension-name {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

/* AI 建议 */
.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.suggestion-card {
  border-radius: 10px;
  padding: 18px;
  border: 1px solid #ebeef5;
}

.suggestion-card.strengths {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.suggestion-card.weaknesses {
  background: #fef0f0;
  border-color: #fde2e2;
}

.suggestion-card.summary {
  background: #f0f7ff;
  border-color: #d9ecff;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
  color: #303133;
}

.suggestion-card p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* 题目 */
.question-header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.question-index {
  font-weight: 600;
  color: #303133;
}

.question-score {
  font-weight: bold;
  font-size: 16px;
}

.question-content {
  padding: 8px 0;
}

.question-section {
  margin-bottom: 16px;
}

.question-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.question-section p {
  margin: 0;
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
  font-size: 14px;
}

.question-section.tip {
  background: #fef9e7;
  padding: 14px;
  border-radius: 8px;
}

.question-section.ref {
  background: #f0f7ff;
  padding: 14px;
  border-radius: 8px;
}

/* 评论 */
.comment-input {
  margin-bottom: 20px;
}

.login-tip {
  text-align: center;
  padding: 16px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

.comment-list {
  border-top: 1px solid #f2f3f5;
  padding-top: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f3f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-user {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
}

.comment-actions {
  margin-top: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
