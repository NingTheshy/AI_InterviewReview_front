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
  publishExperience, getPublicationCandidates, updatePublication, deletePublication
} from '@/api/publication'
import axios from 'axios'
import { getToken } from '@/utils/auth'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const interview = ref(null)
const rubricStatusLabels = {
  FULLY_COVERED: '完全覆盖', MOSTLY_COVERED: '基本覆盖', PARTIALLY_COVERED: '部分覆盖',
  MISSING: '未提及', INCORRECT: '存在错误', NOT_APPLICABLE: '不适用'
}

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
    const res = await axios.get(`${import.meta.env.VITE_APP_BASE_API || ''}/files/${encodeURIComponent(filePath)}`, {
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
const publicationQuestions = ref([])
const publicationTitle = ref('')
const selectedPublicationIds = ref([])
const confirmedSensitiveIds = ref([])
const showPublicationAnswers = ref(false)
const publicationLoading = ref(false)
const publicationPreviewing = ref(false)

const selectedPublicationQuestions = computed(() => publicationQuestions.value.filter(q => selectedPublicationIds.value.includes(q.id)))

async function openPublicationDialog() {
  publicationLoading.value = true
  try {
    const res = await getPublicationCandidates(route.params.id)
    publication.value = res.data
    publicationQuestions.value = res.data?.questions || []
    publicationTitle.value = res.data?.title || `${res.data?.positionTitle || '岗位'}面经-${new Date().toISOString().slice(0, 10)}`
    selectedPublicationIds.value = res.data?.selectedQuestionIds || []
    confirmedSensitiveIds.value = []
    showPublicationAnswers.value = res.data?.showReferenceAnswers || false
    publicationPreviewing.value = false
  } catch {
    return
  } finally {
    publicationLoading.value = false
  }
  publicationDialogVisible.value = true
}

function previewPublication() {
  if (!selectedPublicationIds.value.length) {
    ElMessage.warning('请至少选择一道题目')
    return
  }
  const unconfirmed = selectedPublicationQuestions.value.find(q => q.sensitive && !confirmedSensitiveIds.value.includes(q.id))
  if (unconfirmed) { ElMessage.warning('请逐题确认涉及个人经历的题目'); return }
  if (showPublicationAnswers.value && selectedPublicationQuestions.value.some(q => !q.referenceAnswer?.trim())) {
    ElMessage.warning('所选题目中有题目缺少 AI 标准答案'); return
  }
  publicationPreviewing.value = true
}

async function savePublication() {
  const body = { title: publicationTitle.value, selectedQuestionIds: selectedPublicationIds.value,
    showReferenceAnswers: showPublicationAnswers.value, confirmedSensitiveQuestionIds: confirmedSensitiveIds.value }
  publicationLoading.value = true
  try {
    const res = publication.value?.publishStatus === 'PUBLISHED'
      ? await updatePublication(publication.value.id, body)
      : await publishExperience(route.params.id, body)
    publication.value = res.data
    publicationDialogVisible.value = false
    ElMessage.success('面经已保存并公开')
  } finally {
    publicationLoading.value = false
  }
}

async function handleWithdrawPublication() {
  await ElMessageBox.confirm('删除后旧链接失效，评论、点赞和收藏清零。重新发布将生成新链接。', '删除面经', { type: 'warning' })
  await deletePublication(publication.value.id)
  publication.value = null
  publicationDialogVisible.value = false
  ElMessage.success('面经已删除')
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
const dialogueTurns = computed(() => Array.isArray(interview.value?.dialogueTurns)
  ? interview.value.dialogueTurns : [])

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
      <div class="section-card" v-if="interview.difficultySummary && Object.keys(interview.difficultySummary).length">
        <h3 class="section-title">题目难度与领域表现</h3>
        <p>难度只依据题目要求；均分只统计已计分问题，样本少于 2 题时仅供参考。</p>
        <el-table :data="Object.entries(interview.difficultySummary).map(([level, value]) => ({ level, ...value }))" size="small">
          <el-table-column prop="level" label="难度" />
          <el-table-column prop="questionCount" label="题数" />
          <el-table-column prop="averageScore" label="平均分" />
          <el-table-column label="样本"><template #default="{ row }">{{ row.insufficientSample ? '不足' : '充足' }}</template></el-table-column>
        </el-table>
        <el-table v-if="interview.domainSummary && Object.keys(interview.domainSummary).length"
                  :data="Object.entries(interview.domainSummary).map(([domain, value]) => ({ domain, ...value }))" size="small">
          <el-table-column prop="domain" label="技术领域" />
          <el-table-column prop="questionCount" label="题数" />
          <el-table-column prop="averageScore" label="平均分" />
          <el-table-column label="样本"><template #default="{ row }">{{ row.insufficientSample ? '不足' : '充足' }}</template></el-table-column>
        </el-table>
      </div>

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
        <el-alert v-if="transcriptSegments.some(segment => segment.speakerRole === 'UNKNOWN')"
                  title="部分说话人角色尚无法确认，请使用上方“校正说话人”指定面试官和应聘者。"
                  type="warning" :closable="false" show-icon />
        <div v-if="dialogueTurns.length" class="segment-list">
          <div v-for="turn in dialogueTurns" :key="turn.turnIndex" class="segment-item">
            <div class="segment-meta">
              <el-tag size="small" :type="turn.role === 'CANDIDATE' ? 'success' : turn.role === 'INTERVIEWER' ? 'primary' : 'info'">
                {{ turn.role === 'CANDIDATE' ? '应聘者' : turn.role === 'INTERVIEWER' ? '面试官' : '未知角色' }}
              </el-tag>
              <span>{{ turn.speakerId || 'unknown' }}</span>
              <span>{{ Math.floor((turn.startTimeMs || 0) / 1000) }}s–{{ Math.floor((turn.endTimeMs || 0) / 1000) }}s</span>
              <span>合并 {{ turn.sourceSentenceIndexes?.length || 1 }} 个原始片段</span>
            </div>
            <p>{{ turn.text }}</p>
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
                <el-tag v-if="q.difficultyLevel" size="small" type="warning">{{ q.difficultyLevel }} · K{{ q.knowledgeDepth }}/C{{ q.problemComplexity }}</el-tag>
                <el-tag v-if="!q.includedInScore" size="small" type="info">低置信度·不计分</el-tag>
                <el-tag v-if="q.criticalErrors?.length" size="small" type="danger">存在关键错误</el-tag>
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
              <div class="question-section" v-if="q.followUpTexts?.length">
                <h4>面试官追问</h4>
                <p v-for="(followUp, index) in q.followUpTexts" :key="index">{{ index + 1 }}. {{ followUp }}</p>
              </div>
              <div class="question-section" v-if="q.difficultyLevel">
                <h4>题目难度依据</h4>
                <p>{{ q.domain }} · {{ q.questionCategory }} · {{ q.difficultyLevel }}（知识深度 K{{ q.knowledgeDepth }}，解题复杂度 C{{ q.problemComplexity }}）</p>
                <p v-if="q.knowledgePoints?.length">知识点：{{ q.knowledgePoints.join('、') }}</p>
                <p v-if="q.difficultyReason">{{ q.difficultyReason }}</p>
              </div>
              <div class="question-section" v-if="q.answerText">
                <h4>你的回答</h4>
                <p>{{ q.answerText }}</p>
              </div>
              <div class="question-section" v-else-if="q.includedInScore">
                <h4>你的回答</h4>
                <p>未作答</p>
              </div>
              <div class="question-section low-confidence" v-if="!q.includedInScore">
                <h4>不计分原因</h4>
                <p>{{ q.lowConfidenceReason || '问答证据不足，请核对转写和说话人角色后重新分析。' }}</p>
              </div>
              <div class="mini-dimensions" v-if="q.includedInScore">
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
              <div class="question-section" v-if="q.answerEvidence?.length">
                <h4>回答证据</h4>
                <p v-for="(evidence, index) in q.answerEvidence" :key="index">“{{ evidence }}”</p>
              </div>
              <div class="question-section critical-errors" v-if="q.criticalErrors?.length">
                <h4>关键错误 · 本题最高 69 分</h4>
                <p v-for="(error, index) in q.criticalErrors" :key="index">{{ index + 1 }}. {{ error }}</p>
              </div>
              <div class="question-section rubric" v-if="q.rubricDetail?.items?.length">
                <h4>评分要点</h4>
                <div class="rubric-item" v-for="item in q.rubricDetail.items" :key="item.id">
                  <div class="rubric-heading">
                    <strong>{{ item.title }}</strong>
                    <el-tag size="small" effect="plain" :type="item.status === 'INCORRECT' ? 'danger' : 'info'">
                      {{ rubricStatusLabels[item.status] || item.status }}
                    </el-tag>
                    <span>{{ item.awardedScore ?? 0 }} / {{ item.weight }} 分</span>
                  </div>
                  <p v-if="item.evidence">原文证据：“{{ item.evidence }}”</p>
                  <p v-if="item.missingPoints?.length">缺失：{{ item.missingPoints.join('、') }}</p>
                  <p v-if="item.incorrectClaims?.length">错误：{{ item.incorrectClaims.join('、') }}</p>
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
                <p v-if="q.rubricDetail?.keyPoints?.length" class="reference-key-points">
                  关键要点：{{ q.rubricDetail.keyPoints.join('、') }}
                </p>
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

      <el-dialog v-model="publicationDialogVisible" title="发布题目面经" width="780px">
        <el-alert
          v-if="publication?.moderationStatus === 'BLOCKED'"
          type="error"
          :closable="false"
          title="该面经已被管理员下架，用户无法自行重新发布"
          style="margin-bottom: 14px"
        />
        <template v-if="!publicationPreviewing">
        <el-input v-model="publicationTitle" maxlength="200" show-word-limit placeholder="面经标题" />
        <p>请选择要公开的面试题。个人经历等题目默认不选；勾选后须逐题确认。</p>
        <el-switch v-model="showPublicationAnswers" active-text="公开所选题目的 AI 标准答案" inactive-text="只公开题目" @change="confirmedSensitiveIds = []" />
        <div style="max-height: 420px; overflow-y: auto; margin-top: 16px">
          <div v-for="q in publicationQuestions" :key="q.id" class="question-section" style="margin-bottom: 12px; padding: 12px; border: 1px solid #ebeef5; border-radius: 8px">
            <el-checkbox v-model="selectedPublicationIds" :label="q.id">第 {{ q.questionIndex }} 题：{{ q.questionText }}</el-checkbox>
            <el-tag v-if="q.sensitive" type="warning" size="small">可能涉及隐私</el-tag>
            <template v-if="selectedPublicationIds.includes(q.id)">
              <p v-if="showPublicationAnswers" style="white-space: pre-wrap">AI 标准答案：{{ q.referenceAnswer || '暂无答案，请取消选择此题' }}</p>
              <el-checkbox v-if="q.sensitive" v-model="confirmedSensitiveIds" :label="q.id">
                我已逐字检查本题{{ showPublicationAnswers ? '及答案' : '' }}，确认可以公开
              </el-checkbox>
            </template>
          </div>
        </div>
        </template>
        <div v-else style="max-height: 480px; overflow-y: auto">
          <h2>{{ publicationTitle || `${publication?.positionTitle}面经` }}</h2>
          <p>岗位：{{ publication?.positionTitle }}</p>
          <p>公开方式：{{ showPublicationAnswers ? '题目及 AI 标准答案' : '仅题目' }}</p>
          <article v-for="q in selectedPublicationQuestions" :key="q.id" class="question-section" style="margin: 12px 0; padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; white-space: pre-wrap">
            <strong>第 {{ q.questionIndex }} 题：{{ q.questionText }}</strong>
            <p v-if="showPublicationAnswers">AI 标准答案：{{ q.referenceAnswer }}</p>
          </article>
        </div>
        <el-alert title="公开页不会展示原回答、简历、完整转写和个人评分；若文字中包含手机号、邮箱或身份证号，服务端会拒绝发布该题。"
                  type="info" :closable="false" style="margin-top: 12px" />
        <template #footer>
          <el-button v-if="publication?.publishStatus === 'PUBLISHED'" type="danger" plain @click="handleWithdrawPublication">删除面经</el-button>
          <el-button v-if="publication?.publishStatus === 'PUBLISHED'" @click="openPublishedExperience">查看公开页</el-button>
          <el-button v-if="publicationPreviewing" @click="publicationPreviewing = false">返回修改</el-button>
          <el-button
            type="primary"
            :loading="publicationLoading"
            :disabled="publication?.moderationStatus === 'BLOCKED'"
            @click="publicationPreviewing ? savePublication() : previewPublication()"
          >
            {{ publicationPreviewing ? (publication?.publishStatus === 'PUBLISHED' ? '确认保存' : '确认发布') : '预览公开内容' }}
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
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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

.question-section.low-confidence {
  background: #f5f7fa;
  padding: 14px;
  border-radius: 8px;
}

.question-section.critical-errors {
  background: #fef0f0;
  padding: 14px;
  border-radius: 8px;
}

.rubric-item {
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.rubric-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.rubric-heading span:last-child {
  margin-left: auto;
  color: #606266;
}

.question-section .reference-key-points {
  margin-top: 10px;
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
