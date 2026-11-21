<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminExperienceList, getAdminExperienceDetail, setExperienceStatus } from '@/api/admin'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const filters = reactive({ title: '', author: '', company: '', position: '', moderation: '', dates: [] })
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const compactViewport = ref(window.innerWidth < 1200)
const narrowViewport = ref(window.innerWidth < 1000)
const tinyViewport = ref(window.innerWidth < 900)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    for (const key of ['title', 'author', 'company', 'position']) {
      if (filters[key]?.trim()) params[key] = filters[key].trim()
    }
    if (filters.moderation) params.moderation = filters.moderation
    if (filters.dates?.length === 2) [params.from, params.to] = filters.dates
    const res = await getAdminExperienceList(params)
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function search() { pagination.page = 1; fetchList() }
function reset() {
  Object.assign(filters, { title: '', author: '', company: '', position: '', moderation: '', dates: [] })
  search()
}

function handlePageChange(page) {
  pagination.page = page
  fetchList()
}

function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchList()
}

async function handleToggleStatus(row) {
  const newStatus = row.moderationStatus === 'NORMAL' ? 0 : 1
  const action = newStatus === 0 ? '下架' : '重新上架'
  try {
    await ElMessageBox.confirm(`确定要${action}该经验吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await setExperienceStatus(row.id, { isPublic: newStatus })
    ElMessage.success(`已${action}`)
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

async function viewDetail(row) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = (await getAdminExperienceDetail(row.id)).data
  } finally {
    detailLoading.value = false
  }
}

function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function updateViewport() {
  compactViewport.value = window.innerWidth < 1200
  narrowViewport.value = window.innerWidth < 1000
  tinyViewport.value = window.innerWidth < 900
}

onMounted(() => {
  window.addEventListener('resize', updateViewport)
  fetchList()
})
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <div class="admin-experiences">
    <el-card class="management-card">
      <template #header>
        <span>经验管理</span>
      </template>

      <div class="filter-bar">
        <el-input v-model="filters.title" placeholder="面经标题" clearable @keyup.enter="search" />
        <el-input v-model="filters.author" placeholder="发布者" clearable @keyup.enter="search" />
        <el-input v-model="filters.company" placeholder="公司" clearable @keyup.enter="search" />
        <el-input v-model="filters.position" placeholder="岗位" clearable @keyup.enter="search" />
        <el-select v-model="filters.moderation" placeholder="治理状态" clearable @change="search">
          <el-option label="正常" value="NORMAL" /><el-option label="已下架" value="BLOCKED" />
        </el-select>
        <el-date-picker v-model="filters.dates" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
          format="MM-DD HH:mm" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间"
          @change="search" />
        <el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe table-layout="fixed" class="management-table">
        <el-table-column label="面经标题" min-width="210">
          <template #default="{ row }">
            <div class="cell-text" :title="`#${row.id} ${row.title || ''}`">#{{ row.id }} {{ row.title || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="!narrowViewport" label="发布者" min-width="95">
          <template #default="{ row }"><div class="cell-text" :title="row.authorDisplayName || row.username || String(row.userId)">{{ row.authorDisplayName || row.username || row.userId }}</div></template>
        </el-table-column>
        <el-table-column v-if="!compactViewport" label="公司 / 岗位" min-width="190">
          <template #default="{ row }">
            <div class="cell-text" :title="[row.companyName, row.positionTitle].filter(Boolean).join(' / ')">{{ row.companyName || '--' }} / {{ row.positionTitle || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="!tinyViewport" label="发布时间" width="145">
          <template #default="{ row }">{{ formatTime(row.publishedAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.moderationStatus === 'BLOCKED' ? 'danger' : 'success'" size="small">
              {{ row.moderationStatus === 'BLOCKED' ? '已下架' : '正常公开' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-permission="'experience:read_all'" link size="small" @click="viewDetail(row)">查看</el-button>
              <el-button
                v-permission="'experience:manage'"
                :type="row.moderationStatus === 'NORMAL' ? 'danger' : 'success'"
                link size="small"
                @click="handleToggleStatus(row)"
              >
                {{ row.moderationStatus === 'NORMAL' ? '下架' : '重新上架' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无经验数据" />
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
    <el-drawer v-model="detailVisible" title="面经内容" size="min(680px, 100%)">
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detail">
          <h2>{{ detail.title }}</h2>
          <p>发布者：{{ detail.username || '用户已注销' }}　公司：{{ detail.companyName || '--' }}　岗位：{{ detail.positionTitle || '--' }}</p>
          <p>状态：{{ detail.moderationStatus === 'BLOCKED' ? '已下架' : '正常公开' }}</p>
          <p>发布时间：{{ formatTime(detail.publishedAt) }}</p>
          <el-divider />
          <el-empty v-if="!detail.questions?.length" description="没有已选择的题目" />
          <article v-for="question in detail.questions" :key="question.questionIndex" class="detail-question">
            <h3>第 {{ question.questionIndex }} 题：{{ question.questionText }}</h3>
            <p v-if="question.referenceAnswer">AI 标准答案：{{ question.referenceAnswer }}</p>
          </article>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 20px;
  position: sticky;
  bottom: 0;
  z-index: 5;
  background: #fff;
}
.admin-experiences { min-height: 100%; display: flex; }
.management-card { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: visible; }
.management-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.filter-bar { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(0, 2fr) auto auto; align-items: center; gap: 8px; min-width: 0; margin-bottom: 18px; }
.filter-bar :deep(.el-button + .el-button) { margin-left: 0; }
.filter-bar :deep(.el-input), .filter-bar :deep(.el-select), .filter-bar :deep(.el-date-editor) { width: 100%; min-width: 0; }
.management-table { width: 100%; }
.management-table :deep(.el-table__cell) { padding: 8px 0; }
.management-table :deep(.el-table__row) { height: 50px; }
.cell-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-actions { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.row-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 1000px) {
  .filter-bar { gap: 5px; }
  .filter-bar :deep(.el-button) { padding-left: 8px; padding-right: 8px; }
}
.detail-question { padding: 12px 0; border-top: 1px solid #e8edf2; white-space: pre-wrap; }
</style>
