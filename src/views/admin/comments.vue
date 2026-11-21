<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCommentList, getAdminCommentDetail, deleteAdminComment } from '@/api/admin'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const filters = reactive({ keyword: '', author: '', experience: '', status: 0, timeRange: [] })
const detail = ref(null)
const detailVisible = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size, status: filters.status }
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim()
    if (filters.author.trim()) params.author = filters.author.trim()
    if (filters.experience.trim()) params.experience = filters.experience.trim()
    if (filters.timeRange?.length === 2) {
      params.startTime = filters.timeRange[0]
      params.endTime = filters.timeRange[1]
    }
    const res = await getAdminCommentList(params)
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
  Object.assign(filters, { keyword: '', author: '', experience: '', status: 0, timeRange: [] })
  search()
}

async function showDetail(row) {
  detail.value = null
  detailVisible.value = true
  detail.value = (await getAdminCommentDetail(row.id)).data
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

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('删除后这条评论及全部回复会立即隐藏，记录将在 7 天后清理。确定删除吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAdminComment(row.id)
    ElMessage.success('删除成功')
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
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="admin-comments">
    <el-card class="pagination-card">
      <template #header>
        <span>评论管理</span>
      </template>

      <div class="filters">
        <el-input v-model="filters.keyword" placeholder="评论内容" clearable @keyup.enter="search" />
        <el-input v-model="filters.author" placeholder="作者昵称或用户名" clearable @keyup.enter="search" />
        <el-input v-model="filters.experience" placeholder="面经标题" clearable @keyup.enter="search" />
        <el-select v-model="filters.status" placeholder="状态">
          <el-option label="正常" :value="0" /><el-option label="已删除" :value="1" />
        </el-select>
        <el-date-picker v-model="filters.timeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
                        start-placeholder="开始时间" end-placeholder="结束时间" range-separator="至" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="content" label="评论内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="作者" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.authorDisplayName || row.username || '未知用户' }}</template>
        </el-table-column>
        <el-table-column label="所属面经" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.experienceTitle || `面经 #${row.experienceId}` }}</template>
        </el-table-column>
        <el-table-column label="回复关系" min-width="125">
          <template #default="{ row }">{{ row.parentId ? `回复评论 #${row.parentId}` : '顶层评论' }}</template>
        </el-table-column>
        <el-table-column label="发表时间" min-width="155">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="82">
          <template #default="{ row }"><el-tag :type="row.deleted ? 'info' : 'success'">{{ row.deleted ? '已删除' : '正常' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button type="primary" link size="small" @click="showDetail(row)">查看</el-button>
              <el-button v-if="!row.deleted" v-permission="'comment:manage'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无评论数据" />
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
    <el-dialog v-model="detailVisible" title="评论详情" width="640px" destroy-on-close>
      <div v-if="detail" class="comment-detail">
        <p><strong>作者：</strong>{{ detail.authorDisplayName || detail.username || '未知用户' }}</p>
        <p><strong>所属面经：</strong>{{ detail.experienceTitle || `面经 #${detail.experienceId}` }}</p>
        <p><strong>发表时间：</strong>{{ formatTime(detail.createdAt) }}</p>
        <p><strong>状态：</strong>{{ detail.deleted ? '已删除' : '正常' }}</p>
        <p v-if="detail.parentId"><strong>回复评论 #{{ detail.parentId }}：</strong>{{ detail.parentContent || '原评论已清理' }}</p>
        <p><strong>评论全文：</strong></p><div class="full-content">{{ detail.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-comments { min-height: 100%; display: flex; }
.pagination-card { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: visible; }
.pagination-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.filters { display: grid; grid-template-columns: 1.15fr 1.05fr 1.05fr .8fr 1.9fr auto auto; align-items: center; gap: 10px; margin-bottom: 18px; }
.filters > * { min-width: 0; }
.filters :deep(.el-date-editor) { width: 100%; }
.row-actions { display: flex; align-items: center; white-space: nowrap; }
.comment-detail p { margin: 0 0 12px; overflow-wrap: anywhere; }
.full-content { white-space: pre-wrap; overflow-wrap: anywhere; background: #f5f7fa; padding: 14px; border-radius: 8px; max-height: 50vh; overflow: auto; }
@media (max-width: 1100px) { .filters { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
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
</style>
