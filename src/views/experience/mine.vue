<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyExperiences, getExperienceEditor,
  publishExperience, updatePublication, deletePublication } from '@/api/publication'
const router = useRouter()
const rows = ref([])
const page = ref(1)
const total = ref(0)
const editor = ref(null)
const selectedIds = ref([])
const confirmedIds = ref([])
const showAnswers = ref(false)
const title = ref('')
const editing = ref(false)
const previewing = ref(false)
async function load() {
  const res = await getMyExperiences({ page: page.value, size: 10 })
  rows.value = res.data.records
  total.value = res.data.total
}
async function open(row) {
  const res = await getExperienceEditor(row.id)
  editor.value = res.data
  title.value = res.data.title || `${res.data.positionTitle || '岗位'}面经-${new Date().toISOString().slice(0, 10)}`
  selectedIds.value = res.data.selectedQuestionIds || []
  confirmedIds.value = []
  showAnswers.value = res.data.showReferenceAnswers || false
  previewing.value = false
  editing.value = true
}
function preview() {
  if (!selectedIds.value.length) return ElMessage.warning('至少选择一道题目')
  const chosen = editor.value.questions.filter(q => selectedIds.value.includes(q.id))
  if (chosen.some(q => q.sensitive && !confirmedIds.value.includes(q.id))) return ElMessage.warning('请逐题确认隐私风险')
  if (showAnswers.value && chosen.some(q => !q.referenceAnswer?.trim())) return ElMessage.warning('所选题目缺少 AI 标准答案')
  previewing.value = true
}
async function save() {
  const body = { title: title.value, selectedQuestionIds: selectedIds.value,
    showReferenceAnswers: showAnswers.value, confirmedSensitiveQuestionIds: confirmedIds.value }
  if (editor.value.publishStatus === 'PUBLISHED') await updatePublication(editor.value.id, body)
  else await publishExperience(editor.value.interviewId, { ...body, sourceExperienceId: editor.value.id })
  editing.value = false
  ElMessage.success('面经已保存并公开')
  await load()
}
async function remove(row) {
  await ElMessageBox.confirm('旧链接将失效，评论、点赞、收藏全部清零。', '删除面经', { type: 'warning' })
  await deletePublication(row.id)
  await load()
}
onMounted(load)
</script>
<template>
  <div class="page">
    <h1>我的面经</h1>
    <el-empty v-if="!rows.length" description="尚未发布面经，可从已完成面试详情中选择题目发布" />
    <el-card v-for="row in rows" :key="row.id" class="post">
      <h3>{{ row.title }}</h3><p>{{ row.positionTitle }} · {{ row.publishStatus === 'PUBLISHED' ? '已发布' : '已删除' }}
        <el-tag v-if="row.moderationStatus === 'BLOCKED'" type="danger">管理员已下架</el-tag></p>
      <el-button v-if="row.publishStatus === 'PUBLISHED' && row.moderationStatus !== 'BLOCKED'" @click="router.push(`/experiences/${row.id}`)">查看</el-button>
      <el-button @click="open(row)">{{ row.moderationStatus === 'BLOCKED' ? '查看内容' : row.publishStatus === 'PUBLISHED' ? '编辑' : '重新发布' }}</el-button>
      <el-button v-if="row.publishStatus === 'PUBLISHED' && row.moderationStatus !== 'BLOCKED'" type="danger" plain @click="remove(row)">删除</el-button>
    </el-card>
    <div v-if="total > 10" class="pagination-wrapper">
      <el-pagination v-model:current-page="page" :page-size="10" :total="total" @current-change="load" />
    </div>
    <el-dialog v-model="editing" :title="editor?.moderationStatus === 'BLOCKED' ? '查看已下架面经' : '编辑题目面经'" width="780px">
      <el-alert v-if="editor?.moderationStatus === 'BLOCKED'" type="error" :closable="false" title="面经已被管理员下架，重新上架前不能编辑或删除" />
      <template v-if="!previewing">
      <el-input v-model="title" :disabled="editor?.moderationStatus === 'BLOCKED'" maxlength="200" show-word-limit placeholder="标题" />
      <p><el-switch v-model="showAnswers" :disabled="editor?.moderationStatus === 'BLOCKED'" active-text="公开 AI 标准答案" inactive-text="只公开题目" @change="confirmedIds = []" /></p>
      <div class="questions">
        <div v-for="q in editor?.questions || []" :key="q.id" class="question">
          <el-checkbox v-model="selectedIds" :disabled="editor?.moderationStatus === 'BLOCKED'" :label="q.id">第 {{ q.questionIndex }} 题：{{ q.questionText }}</el-checkbox>
          <el-tag v-if="q.sensitive" size="small" type="warning">可能涉及隐私</el-tag>
          <template v-if="selectedIds.includes(q.id)">
            <p v-if="showAnswers">AI 标准答案：{{ q.referenceAnswer || '暂无答案' }}</p>
            <el-checkbox v-if="q.sensitive" v-model="confirmedIds" :disabled="editor?.moderationStatus === 'BLOCKED'" :label="q.id">我已逐字预览并确认可以公开</el-checkbox>
          </template>
        </div>
      </div>
      </template>
      <div v-else class="questions">
        <h2>{{ title }}</h2><p>岗位：{{ editor?.positionTitle }}</p>
        <p>公开方式：{{ showAnswers ? '题目及 AI 标准答案' : '仅题目' }}</p>
        <div v-for="q in editor?.questions.filter(item => selectedIds.includes(item.id)) || []" :key="q.id" class="question">
          <strong>第 {{ q.questionIndex }} 题：{{ q.questionText }}</strong>
          <p v-if="showAnswers">AI 标准答案：{{ q.referenceAnswer }}</p>
        </div>
      </div>
      <template #footer><el-button @click="previewing ? previewing = false : editing = false">{{ previewing ? '返回修改' : '取消' }}</el-button>
        <el-button type="primary" :disabled="editor?.moderationStatus === 'BLOCKED'" @click="previewing ? save() : preview()">{{ previewing ? '确认保存并公开' : '预览公开内容' }}</el-button></template>
    </el-dialog>
  </div>
</template>
<style scoped>
.page { flex: 1; display: flex; flex-direction: column; width: 100%; max-width: 1000px; margin: 30px auto; padding: 0 20px; }
.post { margin-bottom: 16px; }
.post p { color: #718096; }
.questions { max-height: 420px; overflow: auto; }
.question { padding: 12px; margin: 10px 0; border: 1px solid #e7edf3; border-radius: 8px; white-space: pre-wrap; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: auto; padding-top: 24px; position: sticky; bottom: 0; z-index: 5; background: #f4f7f8; }
</style>
