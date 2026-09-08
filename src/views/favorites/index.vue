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
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getFavoriteList({ page: pagination.page, size: pagination.size })
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
      <p>收藏的题目和面试记录，方便随时回顾</p>
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
              {{ item.questionText || (item.questionId ? `第 ${item.questionId} 题` : '整场面试') }}
            </h3>
            <p class="card-source" v-if="item.interviewTitle || item.companyName">
              来源：{{ item.interviewTitle || '面试' }}
              <span v-if="item.companyName"> · {{ item.companyName }}</span>
            </p>
            <p class="card-remark" v-if="item.remark">{{ item.remark }}</p>
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
