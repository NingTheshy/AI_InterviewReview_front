<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getAdminInterviewDetail } from '@/api/admin'
import { getToken } from '@/utils/auth'

const props = defineProps({ modelValue: Boolean, interviewId: Number })
const emit = defineEmits(['update:modelValue'])
const loading = ref(false)
const detail = ref(null)
const audioUrl = ref('')
const audioLoading = ref(false)
const activeTab = ref('basic')

const statusText = { 0: '处理中', 1: '已完成', 2: '失败', 3: '已取消' }
const roleText = { INTERVIEWER: '面试官', CANDIDATE: '应聘者', UNKNOWN: '未知角色' }
const dimensions = computed(() => {
  const item = detail.value || {}
  return [
    ['内容质量', item.dimensionContent], ['逻辑性', item.dimensionLogic],
    ['表达能力', item.dimensionExpression], ['专业度', item.dimensionProfessional],
    ['沟通能力', item.dimensionCommunication]
  ]
})

function releaseAudio() {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
}

async function loadDetail(id) {
  loading.value = true
  detail.value = null
  activeTab.value = 'basic'
  releaseAudio()
  try {
    const response = await getAdminInterviewDetail(id)
    if (props.interviewId !== id || !props.modelValue) return
    detail.value = response.data
  } finally {
    loading.value = false
  }
}

async function loadAudio() {
  const id = props.interviewId
  if (!id || audioLoading.value) return
  audioLoading.value = true
  try {
    const audio = await axios.get(`${import.meta.env.VITE_APP_BASE_API || ''}/admin/interviews/${id}/audio`, {
      responseType: 'blob', headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (props.interviewId === id && props.modelValue) audioUrl.value = URL.createObjectURL(audio.data)
  } catch {
    ElMessage.warning('音频暂时无法读取，其余复盘内容仍可查看')
  } finally {
    audioLoading.value = false
  }
}

watch(() => [props.modelValue, props.interviewId], ([open, id]) => {
  if (open && id) loadDetail(id)
  else { detail.value = null; releaseAudio() }
}, { immediate: true })
onBeforeUnmount(releaseAudio)

function transcriptItems() {
  const data = detail.value?.dialogueTurns || detail.value?.transcriptSegments
  return Array.isArray(data) ? data : []
}
function seconds(ms) {
  const value = Number(ms || 0)
  return `${Math.floor(value / 60000).toString().padStart(2, '0')}:${Math.floor(value % 60000 / 1000).toString().padStart(2, '0')}`
}
function formatTime(value) { return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—' }
</script>

<template>
  <el-drawer :model-value="modelValue" :title="detail?.title || '面试完整复盘'" size="min(850px, 96vw)"
    @update:model-value="emit('update:modelValue', $event)">
    <div v-loading="loading" class="recap">
      <template v-if="detail">
        <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="面试 ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detail.title || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText[detail.status] || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="公司">{{ detail.companyName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ detail.positionTitle || '—' }}</el-descriptions-item>
          <el-descriptions-item label="轮次">{{ detail.interviewRound || '—' }}</el-descriptions-item>
          <el-descriptions-item label="实际面试时间">{{ formatTime(detail.interviewAt) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="面试类型">{{ detail.interviewType || '—' }}</el-descriptions-item>
          <el-descriptions-item label="综合评分">{{ detail.overallScore ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="处理阶段">{{ detail.processingStep ?? '—' }}</el-descriptions-item>
        </el-descriptions>
        <el-alert v-if="detail.errorMessage" :title="detail.errorMessage" type="warning" show-icon :closable="false" />
        </el-tab-pane>

        <el-tab-pane label="岗位与简历" name="context">
          <h3>岗位描述</h3><p class="pre-wrap">{{ detail.jdText || '暂无' }}</p>
          <h3>面试绑定的简历正文</h3><p class="pre-wrap">{{ detail.resumeText || '暂无' }}</p>
        </el-tab-pane>

        <el-tab-pane label="录音与转写" name="transcript">
        <section v-if="detail.audioFilePath">
          <h3>面试录音</h3>
          <audio v-if="audioUrl" :src="audioUrl" controls preload="none" class="audio" />
          <el-button v-else :loading="audioLoading" @click="loadAudio">加载录音</el-button>
        </section>
        <section>
          <h3>转写记录</h3>
          <div v-if="transcriptItems().length" class="transcript">
            <div v-for="(item, index) in transcriptItems()" :key="index" class="turn">
              <strong>{{ roleText[item.role] || item.speakerId || '未知角色' }}</strong>
              <small v-if="item.startTimeMs != null">
                {{ seconds(item.startTimeMs) }} – {{ seconds(item.endTimeMs) }}
              </small>
              <p>{{ item.text || item.content || '—' }}</p>
            </div>
          </div>
          <p v-else class="pre-wrap">{{ detail.transcriptText || '暂无转写' }}</p>
        </section>
        </el-tab-pane>

        <el-tab-pane label="AI 复盘" name="report">

        <section>
          <h3>评分与总结</h3>
          <div class="dimension-grid">
            <span v-for="[name, score] in dimensions" :key="name">{{ name }}：{{ score ?? '—' }}</span>
          </div>
          <p v-if="detail.strengths" class="pre-wrap"><b>优势：</b>{{ detail.strengths }}</p>
          <p v-if="detail.weaknesses" class="pre-wrap"><b>待提升：</b>{{ detail.weaknesses }}</p>
          <p v-if="detail.improvementSummary" class="pre-wrap"><b>改进建议：</b>{{ detail.improvementSummary }}</p>
        </section>

        <section>
          <h3>问答与逐题评分</h3>
          <el-empty v-if="!detail.questions?.length" description="暂无识别的问题" />
          <el-card v-for="(q, index) in detail.questions || []" :key="q.id || index" class="question">
            <template #header>
              <b>{{ index + 1 }}. {{ q.questionText }}</b>
              <el-tag size="small" class="question-score">{{ q.includedInScore === false ? '未计分' : (q.score ?? '未评分') + ' 分' }}</el-tag>
            </template>
            <p class="pre-wrap"><b>候选人回答：</b>{{ q.answerText || '未回答' }}</p>
            <p class="pre-wrap"><b>标准答案：</b>{{ q.referenceAnswer || '暂无' }}</p>
            <p v-if="q.answerDifference" class="pre-wrap"><b>答案差距：</b>{{ q.answerDifference }}</p>
            <p v-if="q.improvementTip" class="pre-wrap"><b>建议：</b>{{ q.improvementTip }}</p>
            <p v-if="q.lowConfidenceReason" class="pre-wrap"><b>未计分原因：</b>{{ q.lowConfidenceReason }}</p>
          </el-card>
        </section>
        </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.recap { min-height: 180px; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
.recap section { border-top: 1px solid #e9edf3; padding-top: 14px; }
.recap h3 { margin: 0 0 12px; }
.audio { width: 100%; }
.transcript { max-height: 320px; overflow: auto; background: #f7f9fc; padding: 12px; border-radius: 8px; }
.turn { border-bottom: 1px solid #e3e8ef; padding: 8px 2px; }
.turn:last-child { border: 0; }
.turn small { margin-left: 12px; color: #909399; }
.turn p { margin: 5px 0 0; white-space: pre-wrap; }
.dimension-grid { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.pre-wrap { white-space: pre-wrap; overflow-wrap: anywhere; }
.question { margin-bottom: 12px; }
.question-score { float: right; margin-left: 8px; }
</style>
