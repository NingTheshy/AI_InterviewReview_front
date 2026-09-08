<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getShareDetail } from '@/api/share'

const route = useRoute()
const loading = ref(true)
const shareData = ref(null)

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

onMounted(async () => {
  const token = route.params.token
  try {
    const res = await getShareDetail(token)
    shareData.value = res.data
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="share-page">
    <!-- 顶部导航 -->
    <header class="share-nav">
      <div class="nav-inner">
        <span class="logo">🎯 AI 面试复盘</span>
        <span class="nav-desc">面试复盘分享</span>
      </div>
    </header>

    <div class="share-content" v-loading="loading">
      <template v-if="shareData">
        <!-- 顶部信息卡片 -->
        <div class="hero-card">
          <div class="hero-info">
            <div class="hero-tags">
              <el-tag v-if="shareData.interviewType" effect="plain" round size="small">
                {{ interviewTypeMap[shareData.interviewType] || shareData.interviewType }}
              </el-tag>
            </div>
            <h1 class="hero-title">{{ shareData.title || '面试复盘分享' }}</h1>
            <div class="hero-meta">
              <span v-if="shareData.companyName">{{ shareData.companyName }}</span>
              <span v-if="shareData.positionTitle">{{ shareData.positionTitle }}</span>
              <span v-if="shareData.industry">{{ shareData.industry }}</span>
              <span>👁️ {{ shareData.viewCount || 0 }} 浏览</span>
              <span>{{ formatTime(shareData.createdAt) }}</span>
            </div>
          </div>
          <div class="hero-score" v-if="shareData.overallScore != null">
            <div class="big-score" :style="{ color: getScoreColor(shareData.overallScore) }">
              {{ shareData.overallScore }}
            </div>
            <div class="score-desc" :style="{ color: getScoreColor(shareData.overallScore) }">
              {{ getScoreLabel(shareData.overallScore) }}
            </div>
          </div>
        </div>

        <!-- 维度评分 -->
        <div class="section-card" v-if="shareData.overallScore != null">
          <h3 class="section-title">📊 评分维度</h3>
          <div class="dimension-grid">
            <div class="dimension-card">
              <el-progress type="circle" :percentage="shareData.dimensionContent || 0" :color="getScoreColor(shareData.dimensionContent)" :width="80" :stroke-width="6" />
              <span class="dimension-name">内容质量</span>
            </div>
            <div class="dimension-card">
              <el-progress type="circle" :percentage="shareData.dimensionLogic || 0" :color="getScoreColor(shareData.dimensionLogic)" :width="80" :stroke-width="6" />
              <span class="dimension-name">逻辑性</span>
            </div>
            <div class="dimension-card">
              <el-progress type="circle" :percentage="shareData.dimensionExpression || 0" :color="getScoreColor(shareData.dimensionExpression)" :width="80" :stroke-width="6" />
              <span class="dimension-name">表达能力</span>
            </div>
            <div class="dimension-card">
              <el-progress type="circle" :percentage="shareData.dimensionProfessional || 0" :color="getScoreColor(shareData.dimensionProfessional)" :width="80" :stroke-width="6" />
              <span class="dimension-name">专业度</span>
            </div>
            <div class="dimension-card">
              <el-progress type="circle" :percentage="shareData.dimensionCommunication || 0" :color="getScoreColor(shareData.dimensionCommunication)" :width="80" :stroke-width="6" />
              <span class="dimension-name">沟通能力</span>
            </div>
          </div>
        </div>

        <!-- AI 建议 -->
        <div class="section-card" v-if="shareData.improvementSummary || shareData.strengths || shareData.weaknesses">
          <h3 class="section-title">💡 AI 改进建议</h3>
          <div class="suggestion-grid">
            <div class="suggestion-card strengths" v-if="shareData.strengths">
              <div class="suggestion-header">
                <span class="suggestion-icon">✅</span>
                <span>优势</span>
              </div>
              <p>{{ shareData.strengths }}</p>
            </div>
            <div class="suggestion-card weaknesses" v-if="shareData.weaknesses">
              <div class="suggestion-header">
                <span class="suggestion-icon">⚠️</span>
                <span>不足</span>
              </div>
              <p>{{ shareData.weaknesses }}</p>
            </div>
            <div class="suggestion-card summary" v-if="shareData.improvementSummary">
              <div class="suggestion-header">
                <span class="suggestion-icon">📝</span>
                <span>总结</span>
              </div>
              <p>{{ shareData.improvementSummary }}</p>
            </div>
          </div>
        </div>

        <!-- 转写文本 -->
        <div class="section-card" v-if="shareData.transcriptText">
          <h3 class="section-title">📄 转写文本</h3>
          <div class="transcript-text">{{ shareData.transcriptText }}</div>
        </div>

        <!-- 题目列表 -->
        <div class="section-card" v-if="shareData.questions && shareData.questions.length > 0">
          <h3 class="section-title">📋 题目评分（{{ shareData.questions.length }} 题）</h3>
          <el-collapse>
            <el-collapse-item
              v-for="q in shareData.questions"
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
      </template>

      <el-empty v-else-if="!loading" description="分享链接不存在或已过期" />
    </div>

    <!-- 底部 -->
    <footer class="share-footer">
      <p>由 AI 面试复盘系统 生成</p>
    </footer>
  </div>
</template>

<style scoped>
.share-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.share-nav {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 24px;
}

.nav-inner {
  max-width: 900px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-desc {
  font-size: 13px;
  color: #909399;
}

/* 内容区 */
.share-content {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

/* Hero 卡片 */
.hero-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* 转写文本 */
.transcript-text {
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 10px;
  font-size: 14px;
}

/* 底部 */
.share-footer {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 13px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
