<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFavoriteList, removeFavorite } from '@/api/favorite'

const router = useRouter()

const loading = ref(false)

function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}
const tableData = ref([])
const filters = reactive({ interviewId: '', minScore: null, maxScore: null, sortBy: 'createdAt' })
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size, sortBy: filters.sortBy }
    if (filters.interviewId) params.interviewId = filters.interviewId
    if (filters.minScore != null) params.minScore = filters.minScore
    if (filters.maxScore != null) params.maxScore = filters.maxScore
    const res = await getFavoriteList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  pagination.page = page
  fetchList()
}

function handleFilter() {
  pagination.page = 1
  fetchList()
}

function resetFilter() {
  Object.assign(filters, { interviewId: '', minScore: null, maxScore: null, sortBy: 'createdAt' })
  handleFilter()
}

function goInterview(id) {
  router.push(`/interview/${id}`)
}

async function handleRemove(row) {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await removeFavorite(row.id)
    ElMessage.success('已取消收藏')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="favorites-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>⭐ 我的收藏</h1>
      <p>按来源、评分和收藏时间回顾面试问题</p>
    </div>

    <div class="filter-card">
      <el-input v-model="filters.interviewId" placeholder="来源面试 ID" clearable style="width: 150px" />
      <el-input-number v-model="filters.minScore" :min="0" :max="100" placeholder="最低分" />
      <el-input-number v-model="filters.maxScore" :min="0" :max="100" placeholder="最高分" />
      <el-select v-model="filters.sortBy" style="width: 150px">
        <el-option label="最近收藏" value="createdAt" />
        <el-option label="评分从高到低" value="score" />
      </el-select>
      <el-button type="primary" @click="handleFilter">筛选</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 收藏列表 -->
    <div class="card-list" v-loading="loading">
      <template v-if="!loading && tableData.length === 0">
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>暂无收藏记录</h3>
          <p>在面试详情中收藏感兴趣的题目</p>
        </div>
      </template>
      <div
        v-for="item in tableData"
        :key="item.id"
        class="favorite-card"
      >
        <div class="card-content" @click="goInterview(item.interviewId)">
          <div class="card-main">
            <h3 class="card-title">
              {{ item.questionText || `问题 ${item.questionId}` }}
              <el-tag v-if="item.archived" type="info" size="small">已归档</el-tag>
            </h3>
            <p class="card-source" v-if="item.interviewTitle || item.companyName">
              来源：{{ item.interviewTitle || '面试' }}
              <span v-if="item.companyName"> · {{ item.companyName }}</span>
            </p>
            <p class="card-remark" v-if="item.remark">{{ item.remark }}</p>
            <p class="card-reference" v-if="item.referenceAnswer">参考答案：{{ item.referenceAnswer }}</p>
          </div>
          <div class="card-right">
            <span class="card-score" v-if="item.score != null" :style="{ color: getScoreColor(item.score) }">
              {{ item.score }} 分
            </span>
            <span class="meta">{{ formatTime(item.createdAt) }}</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="danger" size="small" link @click="handleRemove(item)">
            取消收藏
          </el-button>
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
.favorites-page {
  padding-bottom: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-card {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 10px;
  background: #fff;
}

.card-reference {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  color: #606266;
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 卡片列表 */
.card-list {
  min-height: 200px;
}

.favorite-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.favorite-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-content {
  flex: 1;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-main {
  flex: 1;
}

.card-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-source {
  margin: 0 0 4px;
  font-size: 13px;
  color: #909399;
}

.card-remark {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 20px;
}

.card-score {
  font-size: 16px;
  font-weight: 700;
}

.meta {
  font-size: 12px;
  color: #909399;
}

.card-actions {
  margin-left: 16px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
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
  margin: 0;
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
