<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAiConfigList, createAiConfig, updateAiConfig, deleteAiConfig, setDefaultAiConfig } from '@/api/aiConfig'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })

// 弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增配置')
const formRef = ref(null)
const formLoading = ref(false)
const editId = ref(null)

const form = reactive({
  configName: '',
  provider: '',
  modelName: '',
  apiKey: '',
  apiEndpoint: '',
  configType: 0,
  isDefault: 0,
  sortOrder: 0
})

const formRules = {
  configName: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请输入提供商', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }]
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAiConfigList({ page: pagination.page, size: pagination.size })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogTitle.value = '新增配置'
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑配置'
  editId.value = row.id
  form.configName = row.configName
  form.provider = row.provider
  form.modelName = row.modelName
  form.apiKey = '' // 不回显已脱敏的key
  form.apiEndpoint = row.apiEndpoint || ''
  form.configType = row.configType || 0
  form.isDefault = row.isDefault || 0
  form.sortOrder = row.sortOrder || 0
  dialogVisible.value = true
}

function resetForm() {
  form.configName = ''
  form.provider = ''
  form.modelName = ''
  form.apiKey = ''
  form.apiEndpoint = ''
  form.configType = 0
  form.isDefault = 0
  form.sortOrder = 0
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  formLoading.value = true
  try {
    const data = { ...form }
    if (editId.value) {
      // 编辑时如果 apiKey 为空则不更新
      if (!data.apiKey) delete data.apiKey
      await updateAiConfig(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createAiConfig(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    formLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除配置「${row.configName}」吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteAiConfig(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

async function handleSetDefault(row) {
  try {
    await setDefaultAiConfig(row.id)
    ElMessage.success('已设为默认配置')
    fetchList()
  } catch (error) {
    // 错误已在拦截器中处理
  }
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

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="admin-ai-config">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>AI配置管理</span>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增配置</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.configType === 1 ? 'warning' : 'primary'" size="small">
              {{ row.configType === 1 ? 'ASR' : 'LLM' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="configName" label="配置名称" width="150" />
        <el-table-column prop="provider" label="提供商" width="120" />
        <el-table-column prop="modelName" label="模型" width="150" />
        <el-table-column label="API Key" width="150">
          <template #default="{ row }">{{ row.apiKey }}</template>
        </el-table-column>
        <el-table-column label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
            <el-button v-else type="primary" link size="small" @click="handleSetDefault(row)">
              设为默认
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '--' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无AI配置" />
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="配置类型">
          <el-select v-model="form.configType" style="width: 100%;">
            <el-option label="文本分析评分 (LLM)" :value="0" />
            <el-option label="语音转文字 (ASR)" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="form.configName" placeholder="如：GPT-4o" />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="如：OpenAI" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="如：gpt-4o" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" :placeholder="editId.value ? '留空则不修改' : '请输入API Key'" show-password />
        </el-form-item>
        <el-form-item label="API Endpoint">
          <el-input v-model="form.apiEndpoint" placeholder="可选，自定义接口地址" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
