<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminInterviewList, cancelAdminInterview, retryAdminInterview, editAdminInterview, deleteAdminInterview, restoreAdminInterview } from '@/api/admin'
import AdminInterviewDetail from './AdminInterviewDetail.vue'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const filters = reactive({ title: '', userKeyword: '', company: '', position: '', status: '', deleted: '', dates: [] })
const detailVisible = ref(false)
const selectedInterviewId = ref(null)
const actionLoading = ref(null)
const compactViewport = ref(window.innerWidth < 1050)
const narrowViewport = ref(window.innerWidth < 900)
const editVisible = ref(false)
const editForm = reactive({ id: null, title: '', companyName: '', positionTitle: '', interviewRound: '' })

const statusMap = {
  0: { label: '处理中', type: 'primary' },
  1: { label: '已完成', type: 'success' },
  2: { label: '失败', type: 'danger' },
  3: { label: '已取消', type: 'info' }
}
const stepMap = { 0: '待开始', 1: '语音转写', 2: '问答分析', 3: '保存评分', 4: '复盘完成' }

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    for (const key of ['title', 'userKeyword', 'company', 'position']) {
      if (filters[key]?.trim()) params[key] = filters[key].trim()
    }
    if (filters.status !== '') params.status = Number(filters.status)
    if (filters.deleted !== '') params.deleted = Number(filters.deleted)
    if (filters.dates?.length === 2) [params.from, params.to] = filters.dates
    const res = await getAdminInterviewList(params)
    tableData.value = res.data.records
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
  Object.assign(filters, { title: '', userKeyword: '', company: '', position: '', status: '', deleted: '', dates: [] })
  handleSearch()
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

function openDetail(row) {
  selectedInterviewId.value = row.id
  detailVisible.value = true
}

function openEdit(row) {
  Object.assign(editForm, { id: row.id, title: row.title || '', companyName: row.companyName || '',
    positionTitle: row.positionTitle || '', interviewRound: row.interviewRound || '' })
  editVisible.value = true
}

async function saveEdit() {
  if (!editForm.title.trim() || !editForm.positionTitle.trim()) {
    ElMessage.warning('标题和岗位不能为空')
    return
  }
  actionLoading.value = editForm.id
  try {
    await editAdminInterview(editForm.id, { title: editForm.title.trim(), companyName: editForm.companyName.trim(),
      positionTitle: editForm.positionTitle.trim(), interviewRound: editForm.interviewRound.trim() })
    editVisible.value = false
    ElMessage.success('基础信息已保存')
    await fetchList()
  } finally { actionLoading.value = null }
}

async function runAction(row, action) {
  const labels = { cancel: '取消处理', retry: '重试', delete: '删除', restore: '恢复' }
  if (action !== 'retry') {
    try {
      await ElMessageBox.confirm(`确定要${labels[action]}面试“${row.title || row.id}”吗？`,
        `确认${labels[action]}`, { type: 'warning' })
    } catch { return }
  }
  actionLoading.value = row.id
  try {
    if (action === 'cancel') await cancelAdminInterview(row.id)
    if (action === 'retry') await retryAdminInterview(row.id)
    if (action === 'delete') await deleteAdminInterview(row.id)
    if (action === 'restore') await restoreAdminInterview(row.id)
    ElMessage.success(`${labels[action]}已完成`)
    await fetchList()
  } catch {
    // 请求拦截器展示具体错误。
  } finally {
    actionLoading.value = null
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
  compactViewport.value = window.innerWidth < 1050
  narrowViewport.value = window.innerWidth < 900
}

onMounted(() => {
  window.addEventListener('resize', updateViewport)
  fetchList()
})
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<template>
  <div class="admin-interviews">
    <el-card class="management-card">
      <template #header>
        <span>面试管理</span>
      </template>

      <div class="filter-bar">
        <el-input v-model="filters.title" placeholder="面试标题" clearable @keyup.enter="handleSearch" />
        <el-input v-model="filters.userKeyword" placeholder="用户" clearable @keyup.enter="handleSearch" />
        <el-input v-model="filters.company" placeholder="公司" clearable @keyup.enter="handleSearch" />
        <el-input v-model="filters.position" placeholder="岗位" clearable @keyup.enter="handleSearch" />
        <el-select v-model="filters.status" placeholder="处理状态" clearable @change="handleSearch">
          <el-option v-for="(value, code) in statusMap" :key="code" :label="value.label" :value="Number(code)" />
        </el-select>
        <el-select v-model="filters.deleted" placeholder="记录状态" clearable @change="handleSearch">
          <el-option label="正常" :value="0" /><el-option label="回收站" :value="1" />
        </el-select>
        <el-date-picker v-model="filters.dates" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
          format="MM-DD HH:mm" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间"
          @change="handleSearch" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe table-layout="fixed" class="management-table">
        <el-table-column label="面试信息" min-width="210">
          <template #default="{ row }">
            <div class="cell-main" :title="row.title || ''">{{ row.title || '--' }}</div>
            <div class="cell-sub" :title="[row.companyName, row.positionTitle, row.interviewRound].filter(Boolean).join(' · ')">
              #{{ row.id }} · {{ row.companyName || '未填公司' }} · {{ row.positionTitle || '未填岗位' }}<span v-if="row.interviewRound"> · {{ row.interviewRound }}</span>
            </div>
            <div v-if="narrowViewport" class="cell-sub">用户：{{ row.ownerDisplayName || row.username || row.userId }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="!narrowViewport" label="用户" min-width="90">
          <template #default="{ row }"><div class="cell-main" :title="row.ownerDisplayName || row.username || String(row.userId)">{{ row.ownerDisplayName || row.username || row.userId }}</div></template>
        </el-table-column>
        <el-table-column v-if="!compactViewport" label="时间" width="140">
          <template #default="{ row }">
            <div class="cell-main">{{ formatTime(row.interviewAt) }}</div>
            <div class="cell-sub">创建 {{ formatTime(row.createdAt) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="处理与记录" width="140">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag>
            <el-tag v-if="row.deleted" type="info" size="small" class="record-tag">回收站</el-tag>
            <div class="cell-sub">{{ stepMap[row.processingStep] || '--' }}<span v-if="row.overallScore != null"> · {{ row.overallScore }} 分</span></div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="105" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-permission="'interview:read_all'" link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button v-if="row.deleted" v-permission="'interview:manage_all'" link type="success"
                :disabled="row.purgeAfter && new Date(row.purgeAfter) <= new Date()" :loading="actionLoading === row.id"
                @click="runAction(row, 'restore')">恢复</el-button>
              <el-dropdown v-else v-permission="'interview:manage_all'" trigger="click" @command="command => command === 'edit' ? openEdit(row) : runAction(row, command)">
                <el-button link type="primary">更多</el-button>
                <template #dropdown><el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑基础信息</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 0" command="cancel">取消处理</el-dropdown-item>
                  <el-tooltip v-if="row.status === 2" :content="row.errorMessage || '未记录失败原因'" placement="left">
                    <el-dropdown-item command="retry">失败重试</el-dropdown-item>
                  </el-tooltip>
                  <el-dropdown-item v-if="row.status === 3" command="retry">重新执行</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除到回收站</el-dropdown-item>
                </el-dropdown-menu></template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无面试数据" />
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
    <AdminInterviewDetail v-model="detailVisible" :interview-id="selectedInterviewId" />
    <el-dialog v-model="editVisible" title="编辑面试基础信息" width="480px">
      <el-form label-width="90px">
        <el-form-item label="标题"><el-input v-model="editForm.title" maxlength="200" show-word-limit /></el-form-item>
        <el-form-item label="公司"><el-input v-model="editForm.companyName" maxlength="100" /></el-form-item>
        <el-form-item label="岗位"><el-input v-model="editForm.positionTitle" maxlength="100" /></el-form-item>
        <el-form-item label="面试轮次"><el-input v-model="editForm.interviewRound" maxlength="50" placeholder="例如：一面" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="actionLoading === editForm.id" @click="saveEdit">保存</el-button></template>
    </el-dialog>
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
.admin-interviews { min-height: 100%; display: flex; }
.management-card { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: visible; }
.management-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.filter-bar { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)) minmax(0, 2fr) auto auto; align-items: center; gap: 8px; min-width: 0; margin-bottom: 18px; }
.filter-bar :deep(.el-button + .el-button) { margin-left: 0; }
.filter-bar :deep(.el-input), .filter-bar :deep(.el-select), .filter-bar :deep(.el-date-editor) { width: 100%; min-width: 0; }
.management-table { width: 100%; }
.management-table :deep(.el-table__cell) { padding: 8px 0; }
.cell-main, .cell-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-main { line-height: 18px; }
.cell-sub { color: #7c8795; font-size: 12px; line-height: 17px; }
.record-tag { margin-left: 4px; }
.row-actions { display: flex; align-items: center; gap: 8px; white-space: nowrap; min-height: 32px; }
.row-actions :deep(.el-button + .el-button) { margin-left: 0; }
.row-actions :deep(.el-dropdown) { display: inline-flex; align-items: center; }
@media (max-width: 1000px) {
  .filter-bar { gap: 5px; }
  .filter-bar :deep(.el-button) { padding-left: 8px; padding-right: 8px; }
}
</style>
