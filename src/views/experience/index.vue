<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExperienceList } from '@/api/experience'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const pagination = reactive({
  page: 1,
  size: 12,
  total: 0
})

const searchForm = reactive({
  companyName: '',
  positionTitle: '',
  industry: '',
  sortBy: 'createdAt'
})

const sortOptions = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'overallScore', label: '评分最高' },
  { value: 'viewCount', label: '最多浏览' }
]

const interviewTypeMap = {
  coding: '技术面',
  behavioral: '行为面',
  system_design: '系统设计',
  comprehensive: '综合'
}

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

    const res = await getExperienceList(params)
    list.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.companyName = ''
  searchForm.positionTitle = ''
  searchForm.industry = ''
  searchForm.sortBy = 'createdAt'
  pagination.page = 1
  fetchList()
}

function goDetail(id) {
  router.push(`/experiences/${id}`)
}

function handlePageChange(page) {
  pagination.page = page
  fetchList()
}

function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="experience-page">
    <!-- Hero 区域 -->
    <div class="hero-section">
      <h1 class="hero-title">经验广场</h1>
      <p class="hero-desc">浏览其他用户的面试经验分享，学习面试技巧，提升竞争力</p>
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
        <el-select v-model="searchForm.sortBy" size="large" @change="handleSearch" style="width: 140px">
          <el-option v-for="item in sortOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
      <span class="result-count" v-if="pagination.total > 0">共 {{ pagination.total }} 条经验</span>
    </div>

    <!-- 卡片列表 -->
    <div class="card-grid" v-loading="loading">
      <el-empty v-if="!loading && list.length === 0" description="暂无公开经验" />
      <div
        v-for="item in list"
        :key="item.id"
        class="experience-card"
        @click="goDetail(item.id)"
      >
        <div class="card-top">
          <el-tag v-if="item.interviewType" size="small" type="info" effect="plain" round>
            {{ interviewTypeMap[item.interviewType] || item.interviewType }}
          </el-tag>
          <span class="score-badge" :style="{ background: getScoreColor(item.overallScore) }">
            {{ item.overallScore }}分
          </span>
        </div>
        <h3 class="card-title">{{ item.title || '未命名面试' }}</h3>
        <div class="card-info">
          <span v-if="item.companyName">{{ item.companyName }}</span>
          <span v-if="item.positionTitle">{{ item.positionTitle }}</span>
        </div>
        <div class="card-footer">
          <span class="meta">📝 {{ item.questionCount || 0 }} 题</span>
          <span class="meta">👁️ {{ item.viewCount || 0 }} 浏览</span>
          <span class="meta">{{ formatTime(item.publishedAt) }}</span>
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
.experience-page {
  padding-bottom: 20px;
  --accent: #0e758f;
}

/* Hero 区域 */
.hero-section {
  position: relative;
  overflow: hidden;
  background: linear-gradient(118deg, #123e4a 0%, #117883 55%, #45a778 100%);
  border-radius: 20px;
  padding: 42px;
  margin-bottom: 24px;
  color: #fff;
  box-shadow: 0 16px 32px rgba(22, 110, 105, 0.18);
}

.hero-section::after {
  content: '';
  position: absolute;
  width: 270px;
  height: 270px;
  right: -72px;
  top: -132px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.18);
  box-shadow: 0 0 0 40px rgba(255,255,255,.05), 0 0 0 80px rgba(255,255,255,.03);
}

.hero-section > * { position: relative; z-index: 1; }

.hero-title {
  font-size: clamp(26px, 3vw, 32px);
  font-weight: 750;
  letter-spacing: -0.02em;
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
  max-width: 500px;
}

.hero-search .el-input {
  flex: 1;
}

.hero-search .el-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(0, 35, 42, 0.2);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(21, 59, 69, 0.07);
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(21, 59, 69, 0.05);
}

.filter-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.result-count {
  font-size: 13px;
  color: #909399;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  min-height: 200px;
}

.experience-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(21, 59, 69, 0.05);
  border: 1px solid rgba(21, 59, 69, 0.08);
}

.experience-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 28px rgba(15, 99, 115, 0.13);
  border-color: rgba(15, 116, 144, 0.22);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.score-badge {
  padding: 2px 10px;
  border-radius: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.card-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #183d47;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  color: #909399;
  font-size: 13px;
  margin-bottom: 14px;
}

.card-info span + span::before {
  content: ' · ';
}

.card-footer {
  display: flex;
  gap: 12px;
  color: #909399;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8f0f1;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .hero-section { padding: 28px 22px; border-radius: 16px; }
  .hero-search, .filter-bar, .filter-left { flex-direction: column; align-items: stretch; }
  .hero-search :deep(.el-select), .filter-left :deep(.el-input) { width: 100% !important; }
  .filter-bar { gap: 12px; }
  .card-grid { grid-template-columns: 1fr; }
}
</style>
