<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getInterviewDetail, getInterviewNote, saveInterviewNote,
  getQuestionNote, saveQuestionNote, updateSpeakerRoles
} from '@/api/interview'
import { addFavorite } from '@/api/favorite'
import {
  publishExperience, getPublication, updatePublication, withdrawPublication
} from '@/api/publication'
import axios from 'axios'
import { getToken } from '@/utils/auth'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const interview = ref(null)

// 笔记
const interviewNote = ref('')
const noteLoading = ref(false)
const questionNotes = ref({})

// 音频播放器
const audioRef = ref(null)
const audioUrl = ref('')
const audioLoading = ref(false)
const playbackRate = ref(1)
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

async function loadAudio(filePath) {
  if (!filePath) return
  audioLoading.value = true
  try {
    const res = await axios.get(`/files/${filePath}`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = URL.createObjectURL(res.data)
  } catch (e) {
    console.error('音频加载失败:', e)
  } finally {
    audioLoading.value = false
  }
}

function changeSpeed(rate) {
  playbackRate.value = rate
  if (audioRef.value) {
    audioRef.value.playbackRate = rate
  }
}

onBeforeUnmount(() => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})

// 雷达图
const radarChartRef = ref(null)
let radarChart = null

function initRadarChart() {
  if (!radarChartRef.value || !interview.value) return
  if (radarChart) radarChart.dispose()

  radarChart = echarts.init(radarChartRef.value)
  const data = [
    interview.value.dimensionContent || 0,
    interview.value.dimensionLogic || 0,
    interview.value.dimensionExpression || 0,
    interview.value.dimensionProfessional || 0,
    interview.value.dimensionCommunication || 0
  ]

  radarChart.setOption({
    radar: {
      indicator: [
        { name: '内容质量', max: 100 },
        { name: '逻辑性', max: 100 },
        { name: '表达能力', max: 100 },
        { name: '专业度', max: 100 },
        { name: '沟通能力', max: 100 }
      ],
      radius: '65%',
      axisName: { color: '#606266', fontSize: 13 }
    },
    series: [{
      type: 'radar',
      data: [{
        value: data,
        areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
        lineStyle: { color: '#667eea', width: 2 },
        itemStyle: { color: '#667eea' }
      }]
    }]
  })
}

// 收藏题目
async function handleFavoriteQuestion(questionId) {
  try {
    await addFavorite({
      interviewId: Number(route.params.id),
      questionId: questionId
    })
    ElMessage.success('收藏成功')
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 公开面经发布
const publicationDialogVisible = ref(false)
const publication = ref(null)
const publicationSummary = ref('')
const publicationLoading = ref(false)

async function openPublicationDialog() {
  publicationLoading.value = true
  try {
    const res = await getPublication(route.params.id)
    publication.value = res.data
    publicationSummary.value = res.data?.summaryMarkdown || ''
  } catch {
    publication.value = null
    publicationSummary.value = ''
  } finally {
    publicationLoading.value = false
    publicationDialogVisible.value = true
  }
}

async function savePublication() {
  if (publicationSummary.value.length > 10000) {
    ElMessage.warning('经验总结不能超过 10000 字')
    return
  }
  publicationLoading.value = true
  try {
    const res = publication.value
      ? await updatePublication(route.params.id, publicationSummary.value)
      : await publishExperience(route.params.id, publicationSummary.value)
    publication.value = res.data
    ElMessage.success(publication.value?.publishStatus === 'PUBLISHED' ? '面经已发布' : '面经已保存')
  } finally {
    publicationLoading.value = false
  }
}

async function handleWithdrawPublication() {
  await ElMessageBox.confirm('撤回后公开页面和评论将隐藏，之后可以重新发布。', '撤回面经', { type: 'warning' })
  await withdrawPublication(route.params.id)
  publication.value = null
  publicationDialogVisible.value = false
  ElMessage.success('面经已撤回')
}

function openPublishedExperience() {
  if (publication.value?.id) window.open(`/experiences/${publication.value.id}`, '_blank')
}

// 说话人角色校正
const speakerDialogVisible = ref(false)
const speakerMappings = ref([])
const transcriptSegments = computed(() => {
  const value = interview.value?.transcriptSegments
  if (Array.isArray(value)) return value
  return value?.sentences || value?.segments || []
})

function openSpeakerDialog() {
  const speakers = new Map()
  transcriptSegments.value.forEach(segment => {
    if (segment.speakerId && !speakers.has(segment.speakerId)) {
      speakers.set(segment.speakerId,
        ['CANDIDATE', 'INTERVIEWER'].includes(segment.speakerRole) ? segment.speakerRole : '')
    }
  })
  speakerMappings.value = Array.from(speakers, ([speakerId, role]) => ({ speakerId, role }))
  speakerDialogVisible.value = true
}

async function saveSpeakerMappings() {
  const mappings = speakerMappings.value.filter(item => ['CANDIDATE', 'INTERVIEWER'].includes(item.role))
  if (!mappings.length) {
    ElMessage.warning('请至少为一个说话人选择候选人或面试官角色')
    return
  }
  await updateSpeakerRoles(route.params.id, mappings)
  speakerDialogVisible.value = false
  ElMessage.success('角色映射已保存，正在重新分析')
  fetchDetail()
}

// 题目类型映射
const interviewTypeMap = {
  coding: '技术面',
  behavioral: '行为面',
  system_design: '系统设计',
  comprehensive: '综合'
}

// 获取详情
async function fetchDetail() {
  loading.value = true
  try {
    const res = await getInterviewDetail(route.params.id)
    interview.value = res.data
    fetchInterviewNote()
    loadAudio(res.data.audioFilePath)
    nextTick(() => {
      initRadarChart()
    })
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

// 加载面试笔记
async function fetchInterviewNote() {
  try {
    const res = await getInterviewNote(route.params.id)
    interviewNote.value = res.data?.content || ''
  } catch (error) {
    // 可能没有笔记，忽略
  }
}

// 保存面试笔记
async function handleSaveInterviewNote() {
  noteLoading.value = true
  try {
    await saveInterviewNote(route.params.id, { content: interviewNote.value })
    ElMessage.success('笔记已保存')
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    noteLoading.value = false
  }
}

// 加载题目笔记
async function fetchQuestionNote(questionId) {
  try {
    const res = await getQuestionNote(route.params.id, questionId)
    questionNotes.value[questionId] = res.data?.content || ''
  } catch (error) {
    questionNotes.value[questionId] = ''
  }
}

// 保存题目笔记
async function handleSaveQuestionNote(questionId) {
  try {
    await saveQuestionNote(route.params.id, questionId, { content: questionNotes.value[questionId] })
    ElMessage.success('笔记已保存')
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 格式化时长
function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '--'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

// 格式化时间
function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 评分颜色
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

// 返回列表
function goBack() {
  router.push('/interviews')
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="interview-detail" v-loading="loading">
    <template v-if="interview">
      <!-- 返回按钮 -->
      <div class="back-bar">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>

      <!-- 顶部信息卡片 -->
      <div class="hero-card">
        <div class="hero-info">
          <div class="hero-tags">
            <el-tag v-if="interview.interviewType" effect="plain" round size="small">
              {{ interviewTypeMap[interview.interviewType] || interview.interviewType }}
            </el-tag>
          </div>
          <h1 class="hero-title">{{ interview.title || '面试详情' }}</h1>
          <div class="hero-meta">
            <span v-if="interview.companyName">{{ interview.companyName }}</span>
            <span v-if="interview.positionTitle">{{ interview.positionTitle }}</span>
            <span v-if="interview.industry">{{ interview.industry }}</span>
            <span>{{ formatDuration(interview.audioDuration) }}</span>
            <span>{{ formatTime(interview.createdAt) }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <el-button v-if="transcriptSegments.length" v-permission="'interview:manage'" round @click="openSpeakerDialog">
            校正说话人
          </el-button>
          <el-button v-if="interview.status === 1" v-permission="'experience:publish'" round :loading="publicationLoading" @click="openPublicationDialog">
            <el-icon><Promotion /></el-icon>
            发布面经
          </el-button>
          <div class="hero-score" v-if="interview.overallScore != null">
            <div class="big-score" :style="{ color: getScoreColor(interview.overallScore) }">
              {{ interview.overallScore }}
            </div>
            <div class="score-desc" :style="{ color: getScoreColor(interview.overallScore) }">
              {{ getScoreLabel(interview.overallScore) }}
            </div>
          </div>
        </div>
      </div>

      <el-alert
        v-if="interview.status !== 1 || interview.reanalysisStatus"
        :type="interview.status === 2 ? 'error' : 'info'"
        :closable="false"
        show-icon
        class="status-alert"
        :title="interview.status === 0 ? `处理中：${interview.processingStep || 0}/4` : interview.status === 2 ? (interview.errorMessage || '处理失败') : interview.status === 3 ? '处理已取消，可从列表继续重试' : `重新分析状态：${interview.reanalysisStatus}`"
      />

      <!-- 音频播放器 -->
      <div class="section-card" v-if="interview.audioFilePath">
        <h3 class="section-title">🎙️ 面试音频</h3>
        <div v-if="audioLoading" style="text-align: center; padding: 20px;">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <span style="margin-left: 8px; color: #909399;">音频加载中...</span>
        </div>
        <audio v-show="!audioLoading && audioUrl" ref="audioRef" controls :src="audioUrl" style="width: 100%; border-radius: 8px;">
          您的浏览器不支持音频播放
        </audio>
        <div class="speed-control">
          <span class="speed-label">倍速：</span>
          <el-radio-group v-model="playbackRate" size="small" @change="changeSpeed">
            <el-radio-button v-for="rate in speedOptions" :key="rate" :value="rate">
              {{ rate }}x
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 维度评分 -->
      <div class="section-card" v-if="interview.overallScore != null">
        <h3 class="section-title">📊 评分维度</h3>
        <div class="dimension-content">
          <div ref="radarChartRef" class="radar-chart"></div>
          <div class="dimension-bars">
            <div class="dim-bar-item">
              <span class="dim-bar-label">内容质量</span>
              <el-progress :percentage="interview.dimensionContent || 0" :color="getScoreColor(interview.dimensionContent)" :stroke-width="10" />
            </div>
            <div class="dim-bar-item">
              <span class="dim-bar-label">逻辑性</span>
              <el-progress :percentage="interview.dimensionLogic || 0" :color="getScoreColor(interview.dimensionLogic)" :stroke-width="10" />
            </div>
            <div class="dim-bar-item">
              <span class="dim-bar-label">表达能力</span>
              <el-progress :percentage="interview.dimensionExpression || 0" :color="getScoreColor(interview.dimensionExpression)" :stroke-width="10" />
            </div>
            <div class="dim-bar-item">
              <span class="dim-bar-label">专业度</span>
              <el-progress :percentage="interview.dimensionProfessional || 0" :color="getScoreColor(interview.dimensionProfessional)" :stroke-width="10" />
            </div>
            <div class="dim-bar-item">
              <span class="dim-bar-label">沟通能力</span>
              <el-progress :percentage="interview.dimensionCommunication || 0" :color="getScoreColor(interview.dimensionCommunication)" :stroke-width="10" />
            </div>
          </div>
        </div>
      </div>

      <!-- AI 建议 -->
      <div class="section-card" v-if="interview.improvementSummary || interview.strengths || interview.weaknesses">
        <h3 class="section-title">💡 AI 改进建议</h3>
        <div class="suggestion-grid">
          <div class="suggestion-card strengths" v-if="interview.strengths">
            <div class="suggestion-header">
              <span class="suggestion-icon">✅</span>
              <span>优势</span>
            </div>
            <p>{{ interview.strengths }}</p>
          </div>
          <div class="suggestion-card weaknesses" v-if="interview.weaknesses">
            <div class="suggestion-header">
              <span class="suggestion-icon">⚠️</span>
              <span>不足</span>
            </div>
            <p>{{ interview.weaknesses }}</p>
          </div>
          <div class="suggestion-card summary" v-if="interview.improvementSummary">
            <div class="suggestion-header">
              <span class="suggestion-icon">📝</span>
              <span>总结</span>
            </div>
            <p>{{ interview.improvementSummary }}</p>
          </div>
        </div>
      </div>

      <!-- 转写文本 -->
      <div class="section-card" v-if="interview.transcriptText">
        <h3 class="section-title">📄 角色化转写</h3>
        <div v-if="transcriptSegments.length" class="segment-list">
          <div v-for="(segment, index) in transcriptSegments" :key="`${segment.startTimeMs}-${index}`" class="segment-item">
            <div class="segment-meta">
              <el-tag size="small" :type="segment.speakerRole === 'CANDIDATE' ? 'success' : segment.speakerRole === 'INTERVIEWER' ? 'primary' : 'info'">
                {{ segment.speakerRole === 'CANDIDATE' ? '候选人' : segment.speakerRole === 'INTERVIEWER' ? '面试官' : '未知角色' }}
              </el-tag>
              <span>{{ segment.speakerId || 'unknown' }}</span>
              <span>{{ Math.floor((segment.startTimeMs || 0) / 1000) }}s–{{ Math.floor((segment.endTimeMs || 0) / 1000) }}s</span>
            </div>
            <p>{{ segment.text }}</p>
          </div>
        </div>
        <div v-else class="transcript-text">{{ interview.transcriptText }}</div>
      </div>

      <!-- 题目评分 -->
      <div class="section-card" v-if="interview.questions && interview.questions.length > 0">
        <h3 class="section-title">📋 题目评分（{{ interview.questions.length }} 题）</h3>
        <el-collapse>
          <el-collapse-item
            v-for="q in interview.questions"
            :key="q.id"
            :name="q.id"
            @click="fetchQuestionNote(q.id)"
          >
            <template #title>
              <div class="question-header">
                <span class="question-index">第 {{ q.questionIndex }} 题</span>
                <el-tag size="small" effect="plain">{{ q.questionType || '未分类' }}</el-tag>
                <el-tag v-if="!q.includedInScore" size="small" type="info">低置信度·不计分</el-tag>
                <span class="question-score" :style="{ color: getScoreColor(q.score) }">
                  {{ q.score == null ? '--' : `${q.score} 分` }}
                </span>
                <el-button
                  type="warning"
                  size="small"
                  circle
                  @click.stop="handleFavoriteQuestion(q.id)"
                >
                  <el-icon><Star /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="question-content">
              <div class="question-section">
                <h4>题目</h4>
                <p>{{ q.questionText }}</p>
              </div>
              <div class="question-section" v-if="q.answerText">
                <h4>你的回答</h4>
                <p>{{ q.answerText }}</p>
              </div>
              <div class="mini-dimensions">
                <div class="mini-dim">
                  <span class="mini-label">内容质量</span>
                  <el-progress :percentage="q.dimensionContent || 0" :color="getScoreColor(q.dimensionContent)" :stroke-width="6" :show-text="false" />
                  <span class="mini-value">{{ q.dimensionContent || 0 }}</span>
                </div>
                <div class="mini-dim">
                  <span class="mini-label">逻辑性</span>
                  <el-progress :percentage="q.dimensionLogic || 0" :color="getScoreColor(q.dimensionLogic)" :stroke-width="6" :show-text="false" />
                  <span class="mini-value">{{ q.dimensionLogic || 0 }}</span>
                </div>
                <div class="mini-dim">
                  <span class="mini-label">表达能力</span>
                  <el-progress :percentage="q.dimensionExpression || 0" :color="getScoreColor(q.dimensionExpression)" :stroke-width="6" :show-text="false" />
                  <span class="mini-value">{{ q.dimensionExpression || 0 }}</span>
                </div>
                <div class="mini-dim">
                  <span class="mini-label">专业度</span>
                  <el-progress :percentage="q.dimensionProfessional || 0" :color="getScoreColor(q.dimensionProfessional)" :stroke-width="6" :show-text="false" />
                  <span class="mini-value">{{ q.dimensionProfessional || 0 }}</span>
                </div>
              </div>
              <div class="question-section tip" v-if="q.improvementTip">
                <h4>💡 改进建议</h4>
                <p>{{ q.improvementTip }}</p>
              </div>
              <div class="question-section difference" v-if="q.answerDifference">
                <h4>🔎 关键差距</h4>
                <p>{{ q.answerDifference }}</p>
              </div>
              <div class="question-section ref" v-if="q.referenceAnswer">
                <h4>📖 参考答案</h4>
                <p>{{ q.referenceAnswer }}</p>
              </div>
              <div class="question-section note">
                <h4>📝 我的笔记</h4>
                <el-input
                  v-model="questionNotes[q.id]"
                  type="textarea"
                  :rows="2"
                  placeholder="记录这道题的心得..."
                />
                <el-button type="primary" size="small" style="margin-top: 8px;" @click.stop="handleSaveQuestionNote(q.id)">
                  保存笔记
                </el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="section-card" v-if="interview.archivedQuestions?.length">
        <h3 class="section-title">🗃️ 已归档问题（{{ interview.archivedQuestions.length }}）</h3>
        <el-collapse>
          <el-collapse-item v-for="q in interview.archivedQuestions" :key="q.id" :title="q.questionText" :name="q.id">
            <p>{{ q.answerText }}</p>
            <el-button size="small" type="warning" plain @click="handleFavoriteQuestion(q.id)">收藏/查看历史内容</el-button>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 面试笔记 -->
      <div class="section-card">
        <h3 class="section-title">📝 面试笔记</h3>
        <el-input
          v-model="interviewNote"
          type="textarea"
          :rows="4"
          placeholder="记录这场面试的整体心得..."
        />
        <el-button type="primary" style="margin-top: 12px;" :loading="noteLoading" @click="handleSaveInterviewNote">
          保存笔记
        </el-button>
      </div>

      <el-dialog v-model="publicationDialogVisible" title="公开面经" width="620px">
        <el-alert
          v-if="publication?.moderationStatus === 'BLOCKED'"
          type="error"
          :closable="false"
          title="该面经已被管理员下架，用户无法自行重新发布"
          style="margin-bottom: 14px"
        />
        <el-input
          v-model="publicationSummary"
          type="textarea"
          :rows="10"
          maxlength="10000"
          show-word-limit
          placeholder="使用 Markdown 总结本次面试经验。公开内容不会包含音频、简历、完整转写、原回答和私人笔记。"
        />
        <template #footer>
          <el-button v-if="publication" type="danger" plain @click="handleWithdrawPublication">撤回</el-button>
          <el-button v-if="publication?.id" @click="openPublishedExperience">查看公开页</el-button>
          <el-button
            type="primary"
            :loading="publicationLoading"
            :disabled="publication?.moderationStatus === 'BLOCKED'"
            @click="savePublication"
          >
            {{ publication ? '保存并重新发布' : '立即发布' }}
          </el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="speakerDialogVisible" title="校正说话人角色" width="520px">
        <p class="dialog-hint">只修改角色映射，不改变原始转写文本和时间戳；保存后仅重新执行问答识别和评分。</p>
        <div v-for="mapping in speakerMappings" :key="mapping.speakerId" class="speaker-row">
          <strong>{{ mapping.speakerId }}</strong>
          <el-select v-model="mapping.role" style="width: 180px">
            <el-option label="候选人" value="CANDIDATE" />
            <el-option label="面试官" value="INTERVIEWER" />
            <el-option label="保持未知（不提交）" value="" />
          </el-select>
        </div>
        <template #footer>
          <el-button @click="speakerDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSpeakerMappings">保存并重新分析</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped>
.interview-detail {
  padding-bottom: 40px;
}

.back-bar {
  margin-bottom: 16px;
}

.status-alert {
  margin: 14px 0;
}

.segment-list {
  display: grid;
  gap: 12px;
}

.segment-item {
  padding: 14px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fafbfc;
}

.segment-item p {
  margin: 8px 0 0;
  line-height: 1.75;
}

.segment-meta,
.speaker-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.segment-meta span {
  color: #909399;
  font-size: 12px;
}

.speaker-row {
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.dialog-hint {
  margin-top: 0;
  color: #606266;
  line-height: 1.6;
}

/* 顶部信息卡片 */
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

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.hero-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
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

/* 倍速控制 */
.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.speed-label {
  font-size: 13px;
  color: #909399;
}

/* 维度评分 */
.dimension-content {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.radar-chart {
  width: 300px;
  height: 260px;
  flex-shrink: 0;
}

.dimension-bars {
  flex: 1;
  min-width: 240px;
}

.dim-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dim-bar-label {
  font-size: 13px;
  color: #606266;
  min-width: 60px;
  text-align: right;
}

.dim-bar-item .el-progress {
  flex: 1;
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

.question-section.note {
  background: #f5f7fa;
  padding: 14px;
  border-radius: 8px;
}

.mini-dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.mini-dim {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-label {
  font-size: 12px;
  color: #909399;
  min-width: 56px;
}

.mini-value {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  min-width: 24px;
  text-align: right;
}

.mini-dim .el-progress {
  flex: 1;
}
</style>
