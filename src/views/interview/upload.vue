<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadInterview } from '@/api/interview'
import { getResumeList, getResumeDetail, uploadResume, retryResume, deleteResume } from '@/api/resume'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const resumeLoading = ref(false)
const resumes = ref([])
let resumePollTimer = null

// 表单数据
const form = reactive({
  title: '',
  companyName: '',
  positionTitle: '',
  industry: '',
  interviewType: '',
  jdText: '',
  resumeId: null
})

const audioFile = ref(null)

// 面试类型选项
const interviewTypeOptions = [
  { value: 'coding', label: '技术面', icon: 'Monitor' },
  { value: 'behavioral', label: '行为面', icon: 'ChatDotRound' },
  { value: 'system_design', label: '系统设计', icon: 'Setting' },
  { value: 'comprehensive', label: '综合', icon: 'DataAnalysis' }
]

// 表单验证规则
const formRules = {
  resumeId: [{ required: true, message: '请选择解析成功的简历', trigger: 'change' }],
  positionTitle: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  interviewType: [{ required: true, message: '请选择面试类型', trigger: 'change' }],
  jdText: [{ required: true, message: '请输入岗位JD', trigger: 'blur' }]
}

// 音频文件校验
function handleAudioChange(uploadFile, uploadFiles) {
  const file = uploadFile.raw
  const isAudio = file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.name.endsWith('.mp3') || file.name.endsWith('.wav')
  if (!isAudio) {
    ElMessage.error('请上传 MP3 或 WAV 格式的音频文件')
    // 移除无效文件
    const idx = uploadFiles.indexOf(uploadFile)
    if (idx > -1) uploadFiles.splice(idx, 1)
    return
  }
  const isWithin2GB = file.size <= 2 * 1024 * 1024 * 1024
  if (!isWithin2GB) {
    ElMessage.error('音频文件大小不能超过 2GB')
    const idx = uploadFiles.indexOf(uploadFile)
    if (idx > -1) uploadFiles.splice(idx, 1)
    return
  }
  // 只保留最新选择的文件
  if (uploadFiles.length > 1) {
    uploadFiles.splice(0, uploadFiles.length - 1)
  }
  audioFile.value = file
}

async function handleResumeChange(uploadFile, uploadFiles) {
  const file = uploadFile.raw
  const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf')
  if (!isPDF) {
    ElMessage.error('请上传 PDF 格式的简历文件')
    // 移除无效文件
    const idx = uploadFiles.indexOf(uploadFile)
    if (idx > -1) uploadFiles.splice(idx, 1)
    return
  }
  const isLt20M = file.size / 1024 / 1024 < 20
  if (!isLt20M) {
    ElMessage.error('简历文件大小不能超过 20MB')
    const idx = uploadFiles.indexOf(uploadFile)
    if (idx > -1) uploadFiles.splice(idx, 1)
    return
  }
  resumeLoading.value = true
  try {
    const res = await uploadResume(file)
    ElMessage.success('简历已上传，正在解析')
    await fetchResumes()
    if (res.data?.id) startResumePolling(res.data.id)
  } finally {
    resumeLoading.value = false
    uploadFiles.splice(0, uploadFiles.length)
  }
}

// 移除文件
function removeAudioFile() {
  audioFile.value = null
}

async function fetchResumes() {
  const res = await getResumeList()
  resumes.value = res.data || []
  if (form.resumeId && !resumes.value.some(item => item.id === form.resumeId && item.parseStatus === 1)) {
    form.resumeId = null
  }
}

function startResumePolling(resumeId) {
  stopResumePolling()
  resumePollTimer = setInterval(async () => {
    try {
      const res = await getResumeDetail(resumeId)
      await fetchResumes()
      if (res.data.parseStatus === 1) {
        form.resumeId = res.data.id
        ElMessage.success('简历解析成功，已自动选中')
        stopResumePolling()
      } else if (res.data.parseStatus === 2) {
        ElMessage.error(res.data.parseError || '简历解析失败')
        stopResumePolling()
      }
    } catch {
      stopResumePolling()
    }
  }, 2000)
}

function stopResumePolling() {
  if (resumePollTimer) clearInterval(resumePollTimer)
  resumePollTimer = null
}

async function handleRetryResume(item) {
  await retryResume(item.id)
  ElMessage.success('已重新提交解析')
  await fetchResumes()
  startResumePolling(item.id)
}

async function handleDeleteResume(item) {
  await ElMessageBox.confirm(`确定从简历库隐藏「${item.originalName}」吗？`, '隐藏简历', {
    type: 'warning'
  })
  await deleteResume(item.id)
  if (form.resumeId === item.id) form.resumeId = null
  await fetchResumes()
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (!audioFile.value) {
    ElMessage.error('请上传面试音频文件')
    return
  }
  const formData = new FormData()
  formData.append('audioFile', audioFile.value)
  formData.append('resumeId', String(form.resumeId))
  formData.append('jdText', form.jdText)
  formData.append('positionTitle', form.positionTitle)
  formData.append('interviewType', form.interviewType)

  if (form.title) formData.append('title', form.title)
  if (form.companyName) formData.append('companyName', form.companyName)
  if (form.industry) formData.append('industry', form.industry)

  loading.value = true
  try {
    await uploadInterview(formData)
    ElMessage.success('上传成功，正在处理中')
    router.push('/interviews')
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/interviews')
}

function formatFileSize(size) {
  if (!size) return '--'
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

onMounted(fetchResumes)
onBeforeUnmount(stopResumePolling)
</script>

<template>
  <div class="upload-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button text @click="handleCancel">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h1>创建面试复盘</h1>
      <p>选择已解析简历并上传面试音频，AI 将生成带时间轴的复盘报告</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-position="top"
    >
      <!-- Step 1: 文件上传 -->
      <div class="form-card">
        <div class="step-header">
          <span class="step-num">1</span>
          <div>
            <h3>准备分析材料</h3>
            <p>音频与简历分开管理；只有解析成功的简历可以创建面试</p>
          </div>
        </div>
        <div class="step-body">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="upload-area" :class="{ 'has-file': audioFile }">
                <el-upload
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleAudioChange"
                  :on-remove="removeAudioFile"
                  accept=".mp3,.wav"
                  drag
                >
                  <div class="upload-inner" v-if="!audioFile">
                    <el-icon class="upload-icon"><Microphone /></el-icon>
                    <div class="upload-text">拖拽或点击上传面试音频</div>
                    <div class="upload-hint">支持 MP3 / WAV，最大 2GB、最长 2 小时</div>
                  </div>
                  <div class="upload-inner uploaded" v-else>
                    <el-icon class="upload-icon success"><CircleCheck /></el-icon>
                    <div class="upload-text">{{ audioFile.name }}</div>
                    <div class="upload-hint">点击可重新选择</div>
                  </div>
                </el-upload>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="resume-library" v-loading="resumeLoading">
                <el-form-item label="选择简历" prop="resumeId">
                  <el-select v-model="form.resumeId" placeholder="请选择解析成功的简历" style="width: 100%">
                    <el-option
                      v-for="item in resumes"
                      :key="item.id"
                      :label="`${item.originalName} · ${formatFileSize(item.fileSize)}`"
                      :value="item.id"
                      :disabled="item.parseStatus !== 1"
                    >
                      <div class="resume-option">
                        <span>{{ item.originalName }}</span>
                        <el-tag v-if="item.parseStatus === 0" size="small">解析中</el-tag>
                        <el-tag v-else-if="item.parseStatus === 1" size="small" type="success">可用</el-tag>
                        <el-tag v-else size="small" type="danger">解析失败</el-tag>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-upload
                  :auto-upload="false"
                  :limit="1"
                  :show-file-list="false"
                  :on-change="handleResumeChange"
                  accept=".pdf"
                >
                  <el-button :loading="resumeLoading">
                    <el-icon><Upload /></el-icon>
                    上传新简历
                  </el-button>
                </el-upload>

                <div v-if="resumes.length" class="resume-status-list">
                  <div v-for="item in resumes" :key="item.id" class="resume-status-item">
                    <div>
                      <strong>{{ item.originalName }}</strong>
                      <small v-if="item.parseError">{{ item.parseError }}</small>
                    </div>
                    <div class="resume-actions">
                      <el-button v-if="item.parseStatus === 2" text type="primary" @click="handleRetryResume(item)">重试</el-button>
                      <el-button text type="danger" @click="handleDeleteResume(item)">隐藏</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- Step 2: 基本信息 -->
      <div class="form-card">
        <div class="step-header">
          <span class="step-num">2</span>
          <div>
            <h3>面试信息</h3>
            <p>岗位和面试类型为必填；标题留空时由系统自动生成</p>
          </div>
        </div>
        <div class="step-body">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="面试标题">
                <el-input v-model="form.title" placeholder="如：一面-后端开发-腾讯" maxlength="100" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公司名称">
                <el-input v-model="form.companyName" placeholder="如：腾讯" maxlength="50" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="职位名称" prop="positionTitle">
                <el-input v-model="form.positionTitle" placeholder="如：后端开发工程师" maxlength="50" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="行业">
                <el-input v-model="form.industry" placeholder="如：互联网、金融、教育" maxlength="30" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="面试类型" prop="interviewType">
            <div class="type-options">
              <div
                v-for="item in interviewTypeOptions"
                :key="item.value"
                :class="['type-option', { active: form.interviewType === item.value }]"
                @click="form.interviewType = item.value"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </el-form-item>
        </div>
      </div>

      <!-- Step 3: JD 输入 -->
      <div class="form-card">
        <div class="step-header">
          <span class="step-num">3</span>
          <div>
            <h3>岗位描述</h3>
            <p>粘贴岗位 JD，AI 将根据 JD 内容评估你的回答匹配度</p>
          </div>
        </div>
        <div class="step-body">
          <el-form-item prop="jdText">
            <el-input
              v-model="form.jdText"
              type="textarea"
              :rows="8"
              placeholder="请粘贴岗位描述（JD）内容..."
              maxlength="10000"
              show-word-limit
            />
          </el-form-item>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-area">
        <el-button size="large" @click="handleCancel">取消</el-button>
        <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
          <el-icon><Upload /></el-icon>
          提交面试
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.upload-page {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 12px 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px 0;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-header h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.step-header p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.optional {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  background: #f2f3f5;
  padding: 1px 8px;
  border-radius: 4px;
  margin-left: 6px;
}

.step-body {
  padding: 20px 24px 24px;
}

/* 上传区域 */
.upload-area {
  border-radius: 10px;
  transition: all 0.2s;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: 10px;
  border: 2px dashed #dcdfe6;
  padding: 32px 20px;
  transition: all 0.2s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
}

.upload-area.has-file :deep(.el-upload-dragger) {
  border-color: #67c23a;
  border-style: solid;
}

.upload-inner {
  text-align: center;
}

.upload-icon {
  font-size: 40px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.upload-icon.success {
  color: #67c23a;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
  word-break: break-all;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.resume-library {
  min-height: 164px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fafbfc;
}

.resume-option,
.resume-status-item,
.resume-actions {
  display: flex;
  align-items: center;
}

.resume-option,
.resume-status-item {
  justify-content: space-between;
  gap: 12px;
}

.resume-status-list {
  margin-top: 12px;
  max-height: 116px;
  overflow: auto;
}

.resume-status-item {
  padding: 8px 0;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
}

.resume-status-item strong,
.resume-status-item small {
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-status-item small {
  margin-top: 3px;
  color: #f56c6c;
}

/* 面试类型选择 */
.type-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #606266;
}

.type-option:hover {
  border-color: #667eea;
  color: #667eea;
}

.type-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.06);
  color: #667eea;
  font-weight: 600;
}

/* 提交区域 */
.submit-area {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
