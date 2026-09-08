<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getInterviewList, deleteInterview, retryInterview, getInterviewStatus } from '@/api/interview'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  companyName: '',
  positionTitle: '',
  industry: '',
  interviewType: '',
  sortBy: 'createdAt'
})

// 列表数据
const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  size: 12,
  total: 0
})

// 面试类型选项
const interviewTypeOptions = [
  { value: '', label: '全部' },
  { value: 'coding', label: '技术面' },
  { value: 'behavioral', label: '行为面' },
  { value: 'system_design', label: '系统设计' },
  { value: 'comprehensive', label: '综合' }
]

// 排序选项
const sortOptions = [
  { value: 'createdAt', label: '按创建时间' },
  { value: 'overallScore', label: '按综合评分' }
]

// 面试类型映射
const interviewTypeMap = {
  coding: '技术面',
  behavioral: '行为面',
  system_design: '系统设计',
  comprehensive: '综合'
}

// 状态映射
const statusMap = {
  0: { label: '处理中', type: 'primary', icon: 'Loading' },
  1: { label: '已完成', type: 'success', icon: 'CircleCheck' },
  2: { label: '失败', type: 'danger', icon: 'CircleClose' }
}

// 轮询定时器
let pollTimer = null

// 获取列表数据
async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      sortBy: searchForm.sortBy
    }
    if (searchForm.companyName) params.companyName = searchForm.companyName
    if (searchForm.positionTitle) params.positionTitle = searchForm.positionTitle
    if (searchForm.industry) params.industry = searchForm.industry
    if (searchForm.interviewType) params.interviewType = searchForm.interviewType

    const res = await getInterviewList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total

    // 对处理中的面试启动轮询
    startPolling()
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchList()
}

// 快捷筛选
function quickFilter(type) {
  searchForm.interviewType = type
  handleSearch()
}

// 重置搜索
function handleReset() {
  searchForm.companyName = ''
  searchForm.positionTitle = ''
  searchForm.industry = ''
  searchForm.interviewType = ''
  searchForm.sortBy = 'createdAt'
  pagination.page = 1
  fetchList()
}

// 分页
function handlePageChange(page) {
  pagination.page = page
  fetchList()
}

// 跳转上传页
function goUpload() {
  router.push('/interview/upload')
}

// 跳转详情页
function goDetail(id) {
  router.push(`/interview/${id}`)
}

// 删除面试
async function handleDelete(row, event) {
  event.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `确定要删除面试「${row.title || '未命名面试'}」吗？删除后不可恢复。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteInterview(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

// 重试面试（失败/已完成）
async function handleRetry(row, event) {
  event.stopPropagation()
  try {
    if (row.status === 1) {
      await ElMessageBox.confirm(
        '重新打分将覆盖当前评分结果，确定继续吗？',
        '重新打分',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
    }
    await retryInterview(row.id)
    ElMessage.success('已重新提交处理')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

// 格式化时长（秒 → mm:ss）
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
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function formatFullTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// 轮询处理中的面试状态
function startPolling() {
  stopPolling()
  const processingItems = tableData.value.filter(item => item.status === 0)
  if (processingItems.length === 0) return

  pollTimer = setInterval(async () => {
    for (const item of processingItems) {
      try {
        const res = await getInterviewStatus(item.id)
        if (res.data.status !== 0) {
          fetchList()
          return
        }
      } catch (error) {
        // 忽略轮询错误
      }
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  fetchList()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <div class="interview-page">
    <!-- Hero 区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">我的面试记录</h1>
        <p class="hero-desc">上传面试音频，AI 帮你复盘分析，提升面试表现</p>
        <div class="hero-search">
          <el-input
            v-model="searchForm.companyName"
            placeholder="搜索公司名称..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="goUpload">
            <el-icon><Upload /></el-icon>
            上传面试
          </el-button>
        </div>
        <div class="quick-tags">
          <span
            v-for="item in interviewTypeOptions"
            :key="item.value"
            :class="['quick-tag', { active: searchForm.interviewType === item.value }]"
            @click="quickFilter(item.value)"
          >
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchForm.positionTitle"
          placeholder="职位名称"
          clearable
          size="small"
          @keyup.enter="handleSearch"
          style="width: 160px"
        />
        <el-input
          v-model="searchForm.industry"
          placeholder="行业"
          clearable
          size="small"
          @keyup.enter="handleSearch"
          style="width: 120px"
        />
        <el-button type="primary" size="small" @click="handleSearch">筛选</el-button>
        <el-button size="small" @click="handleReset">重置</el-button>
      </div>
      <div class="filter-right">
        <el-select v-model="searchForm.sortBy" size="small" @change="handleSearch" style="width: 140px">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div class="card-grid" v-loading="loading">
      <template v-if="!loading && tableData.length === 0">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>暂无面试记录</h3>
          <p>上传你的第一段面试音频，开始 AI 复盘之旅</p>
          <el-button type="primary" size="large" @click="goUpload">
            <el-icon><Upload /></el-icon>
            上传面试
          </el-button>
        </div>
      </template>
      <div
        v-for="item in tableData"
        :key="item.id"
        class="interview-card"
        @click="goDetail(item.id)"
      >
        <div class="card-header">
          <el-tag
            :type="statusMap[item.status]?.type || 'info'"
            size="small"
            effect="plain"
            round
          >
            {{ statusMap[item.status]?.label || '未知' }}
          </el-tag>
          <el-tag v-if="item.interviewType" size="small" type="info" effect="plain" round>
            {{ interviewTypeMap[item.interviewType] || item.interviewType }}
          </el-tag>
        </div>
        <h3 class="card-title">{{ item.title || '未命名面试' }}</h3>
        <div class="card-company">
          <span v-if="item.companyName" class="company">{{ item.companyName }}</span>
          <span v-if="item.positionTitle" class="position">{{ item.positionTitle }}</span>
        </div>
        <div class="card-score" v-if="item.overallScore != null">
          <div class="score-circle" :style="{ borderColor: getScoreColor(item.overallScore) }">
            <span class="score-num" :style="{ color: getScoreColor(item.overallScore) }">{{ item.overallScore }}</span>
          </div>
          <span class="score-label" :style="{ color: getScoreColor(item.overallScore) }">
            {{ getScoreLabel(item.overallScore) }}
          </span>
        </div>
        <div class="card-score" v-else-if="item.status === 0">
          <div class="score-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>分析中...</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="meta">{{ formatFullTime(item.createdAt) }}</span>
          <span class="meta" v-if="item.audioDuration">{{ formatDuration(item.audioDuration) }}</span>
          <div class="card-actions">
            <el-button
              v-if="item.status === 1 || item.status === 2"
              type="warning"
              size="small"
              link
              @click="handleRetry(item, $event)"
            >
              {{ item.status === 2 ? '重试' : '重新打分' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(item, $event)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.size"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.interview-page {
  padding-bottom: 20px;
}

/* Hero 区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 20px;
  color: #fff;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
}

.hero-desc {
  font-size: 15px;
  opacity: 0.85;
  margin: 0 0 24px;
}

.hero-search {
  display: flex;
  gap: 12px;
  max-width: 560px;
}

.hero-search .el-input {
  flex: 1;
}

.hero-search .el-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.quick-tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.quick-tag {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  background: rgba(255, 255, 255, 0.35);
}

.quick-tag.active {
  background: #fff;
  color: #667eea;
  font-weight: 600;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.filter-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.interview-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.interview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.card-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-company {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
}

.card-company .company {
  font-weight: 500;
  color: #606266;
}

.card-company .position::before {
  content: '·';
  margin-right: 8px;
}

.card-score {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.score-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-num {
  font-size: 16px;
  font-weight: 700;
}

.score-label {
  font-size: 13px;
  font-weight: 600;
}

.score-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
  font-size: 12px;
  color: #909399;
}

.card-actions {
  margin-left: auto;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #303133;
}

.empty-state p {
  margin: 0 0 24px;
  color: #909399;
  font-size: 14px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
