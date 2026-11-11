<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAiConfigList, createAiConfig, updateAiConfig, deleteAiConfig,
  setDefaultAiConfig, testAiConfig
} from '@/api/aiConfig'

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
  configType: 2,
  isDefault: 0,
  sortOrder: 0
})

const formRules = {
  configName: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请输入提供商', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  apiEndpoint: [{ required: true, message: '请输入请求地址', trigger: 'blur' }],
  configType: [{ required: true, message: '请选择配置类型', trigger: 'change' }]
}

const testDialogVisible = ref(false)
const testingConfig = ref(null)
const testAudioFile = ref(null)
const testLoading = ref(false)

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
  form.apiKey = row.apiKey // 后端识别脱敏值并保留原密钥
  form.apiEndpoint = row.apiEndpoint || ''
  form.configType = row.configType || 2
  form.isDefault = row.isDefault || 0
  form.sortOrder = row.sortOrder || 0
  dialogVisible.value = true
}

function resetForm() {
  form.configName = ''
  form.provider = 'deepseek'
  form.modelName = 'deepseek-flash'
  form.apiKey = ''
  form.apiEndpoint = 'https://api.deepseek.com'
  form.configType = 2
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

function openTest(row) {
  testingConfig.value = row
  testAudioFile.value = null
  if (row.configType === 1) {
    testDialogVisible.value = true
  } else {
    runTest()
  }
}

function handleTestAudioChange(uploadFile, uploadFiles) {
  const file = uploadFile.raw
  const supported = /\.(mp3|wav)$/i.test(file.name)
  if (!supported || file.size > 20 * 1024 * 1024) {
    ElMessage.error('测试音频仅支持 MP3/WAV，且不能超过 20MB')
    uploadFiles.splice(0, uploadFiles.length)
    return
  }
  testAudioFile.value = file
}

async function runTest() {
  if (testingConfig.value?.configType === 1 && !testAudioFile.value) {
    ElMessage.warning('请选择短 MP3/WAV 测试音频')
    return
  }
  testLoading.value = true
  try {
    const res = await testAiConfig(testingConfig.value.id, testAudioFile.value)
    ElMessage.success(res.data || '连接测试成功')
    testDialogVisible.value = false
    fetchList()
  } finally {
    testLoading.value = false
  }
}

watch(() => form.configType, type => {
  if (editId.value) return
  if (type === 1) {
    form.provider = 'dashscope'
    form.modelName = 'qwen-audio-3.1-asr-flash-filetrans'
    form.apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1'
  } else {
    form.provider = 'deepseek'
    form.modelName = 'deepseek-flash'
    form.apiEndpoint = 'https://api.deepseek.com'
  }
})

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
          <el-button v-permission="'ai_config:manage'" type="primary" icon="Plus" @click="handleAdd">新增配置</el-button>
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
        <el-table-column label="测试状态" min-width="170">
          <template #default="{ row }">
            <el-tag :type="row.testStatus === 1 ? 'success' : row.testStatus === 2 ? 'danger' : 'info'" size="small">
              {{ row.testStatus === 1 ? '测试成功' : row.testStatus === 2 ? '测试失败' : '未测试' }}
            </el-tag>
            <div v-if="row.lastTestMessage" class="test-message">{{ row.lastTestMessage }}</div>
          </template>
        </el-table-column>
        <el-table-column label="API Key" width="150">
          <template #default="{ row }">{{ row.apiKey }}</template>
        </el-table-column>
        <el-table-column label="默认" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
            <el-button v-else v-permission="'ai_config:manage'" type="primary" link size="small" :disabled="row.status !== 1 || row.testStatus !== 1" @click="handleSetDefault(row)">
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
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'ai_config:manage'" type="success" link size="small" @click="openTest(row)">测试</el-button>
            <el-button v-permission="'ai_config:manage'" type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-permission="'ai_config:manage'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
        <el-form-item label="配置类型" prop="configType">
          <el-select v-model="form.configType" style="width: 100%;">
            <el-option label="文本分析评分 (LLM)" :value="2" />
            <el-option label="语音转文字 (ASR)" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="form.configName" placeholder="如：DeepSeek Flash" />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="form.provider" style="width: 100%">
            <el-option v-if="form.configType === 2" label="DeepSeek" value="deepseek" />
            <el-option v-else label="DashScope" value="dashscope" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-select v-if="form.configType === 1" v-model="form.modelName" style="width: 100%">
            <el-option label="千问 Audio 3.1 ASR" value="qwen-audio-3.1-asr-flash-filetrans" />
            <el-option label="Paraformer-v2（备选）" value="paraformer-v2" />
          </el-select>
          <el-input v-else v-model="form.modelName" placeholder="如：deepseek-flash" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" :placeholder="editId ? '输入新密钥，或保留脱敏值' : '请输入 API Key'" show-password />
        </el-form-item>
        <el-form-item label="API Endpoint" prop="apiEndpoint">
          <el-input v-model="form.apiEndpoint" placeholder="可填写官方、阿里云兼容或代理地址" />
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

    <el-dialog v-model="testDialogVisible" title="测试 DashScope ASR 配置" width="500px">
      <el-alert type="info" :closable="false" title="上传一段不超过 20MB 的 MP3/WAV，系统将执行临时上传、任务轮询和结果解析。" />
      <el-upload
        style="margin-top: 18px"
        drag
        :auto-upload="false"
        :limit="1"
        :on-change="handleTestAudioChange"
        accept=".mp3,.wav"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖入测试音频或<em>点击选择</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="testDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="testLoading" @click="runTest">开始测试</el-button>
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

.test-message {
  margin-top: 4px;
  max-width: 180px;
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
