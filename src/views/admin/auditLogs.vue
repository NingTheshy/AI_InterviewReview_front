<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAuditLogList } from '@/api/admin'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 20, total: 0 })

async function fetchList() {
  loading.value = true
  try {
    const res = await getAuditLogList({ page: pagination.page, size: pagination.size })
    tableData.value = res.data.records || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '--'
}

function targetTypeText(type) {
  return {
    USER: '用户',
    AI_CONFIG: 'AI 配置',
    INTERVIEW_EXPERIENCE: '面经',
    INTERVIEW_COMMENT: '评论'
  }[type] || '其他资源'
}

function formatSnapshot(value) {
  if (!value) return '无记录'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="audit-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <strong>权限与高风险操作审计</strong>
            <p>记录账号、AI 配置和内容管理操作；展开可查看原始记录</p>
          </div>
          <el-button icon="Refresh" :loading="loading" @click="fetchList">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" row-key="id" class="audit-table">
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="audit-detail">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="日志编号">{{ row.id }}</el-descriptions-item>
                <el-descriptions-item label="来源 IP">{{ row.sourceIp || '未记录' }}</el-descriptions-item>
                <el-descriptions-item label="动作代码">{{ row.action }}</el-descriptions-item>
                <el-descriptions-item label="对象标识">{{ row.targetType }} #{{ row.targetId || '--' }}</el-descriptions-item>
                <el-descriptions-item label="操作前数据" :span="2"><pre>{{ formatSnapshot(row.beforeData) }}</pre></el-descriptions-item>
                <el-descriptions-item label="操作后数据" :span="2"><pre>{{ formatSnapshot(row.afterData) }}</pre></el-descriptions-item>
                <el-descriptions-item v-if="row.failureReason" label="失败原因" :span="2">{{ row.failureReason }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作者" min-width="170">
          <template #default="{ row }">
            <div class="primary-text">{{ row.operatorName || '未知用户' }}</div>
            <div class="secondary-text">{{ row.operatorUsername ? `@${row.operatorUsername}` : row.operatorUserId ? `用户 #${row.operatorUserId}` : '系统执行' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作内容" min-width="300">
          <template #default="{ row }">
            <div class="primary-text">{{ row.actionText || '管理操作' }}</div>
            <div class="secondary-text description" :title="row.description">{{ row.description || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作对象" min-width="180">
          <template #default="{ row }">
            <div class="primary-text">{{ row.targetName || '未知对象' }}</div>
            <div class="secondary-text">{{ row.targetAccount ? `@${row.targetAccount} · ` : '' }}{{ targetTypeText(row.targetType) }} #{{ row.targetId || '--' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="结果" min-width="130">
          <template #default="{ row }">
            <el-tag :type="row.success === 1 ? 'success' : 'danger'" size="small">
              {{ row.success === 1 ? '成功' : '失败' }}
            </el-tag>
            <div v-if="row.failureReason" class="failure-reason" :title="row.failureReason">{{ row.failureReason }}</div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无审计记录" /></template>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @current-change="fetchList"
        @size-change="() => { pagination.page = 1; fetchList() }"
      />
    </el-card>
  </div>
</template>

<style scoped>
.audit-page { padding: 4px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header p { margin: 5px 0 0; color: #909399; font-size: 13px; }
.pagination { justify-content: flex-end; margin-top: 20px; }
.audit-table :deep(.el-table__cell) { padding: 13px 0; }
.primary-text { color: #263b49; font-size: 13px; font-weight: 600; }
.secondary-text { margin-top: 5px; color: #8b9ba7; font-size: 11px; }
.description, .failure-reason { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.failure-reason { margin-top: 6px; color: #d36359; font-size: 11px; }
.audit-detail { padding: 14px 20px 18px 48px; background: #fafbfc; }
.audit-detail pre { max-width: 100%; margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; font: 11px/1.55 ui-monospace, Consolas, monospace; }
@media (max-width: 768px) {
  .audit-detail { padding: 12px; }
  .audit-detail :deep(.el-descriptions__body) { overflow-x: auto; }
  .pagination { overflow-x: auto; justify-content: flex-start; }
}
</style>
