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

onMounted(fetchList)
</script>

<template>
  <div class="audit-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <strong>权限与高风险操作审计</strong>
            <p>只读记录，不提供修改和删除操作</p>
          </div>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operatorUserId" label="操作者" width="100" />
        <el-table-column prop="action" label="动作" min-width="170" />
        <el-table-column prop="targetType" label="对象类型" width="120" />
        <el-table-column prop="targetId" label="对象ID" width="110" />
        <el-table-column prop="success" label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.success === 1 ? 'success' : 'danger'" size="small">
              {{ row.success === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="failureReason" label="失败原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="发生时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
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
</style>
