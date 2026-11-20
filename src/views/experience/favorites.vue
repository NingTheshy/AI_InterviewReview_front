<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExperienceFavorites } from '@/api/publication'
import { unfavoriteExperience } from '@/api/experience'
const router = useRouter()
const rows = ref([])
const page = ref(1)
const total = ref(0)
async function load() {
  const res = await getExperienceFavorites({ page: page.value, size: 10 })
  rows.value = res.data.records
  total.value = res.data.total
}
async function remove(row) { await unfavoriteExperience(row.id); await load() }
onMounted(load)
</script>
<template>
  <div class="page"><h1>收藏的面经</h1>
    <el-empty v-if="!rows.length" description="暂无收藏的面经" />
    <el-card v-for="row in rows" :key="row.id" class="post">
      <h3>{{ row.title }}</h3><p>{{ row.positionTitle }} · {{ row.questionCount }} 道题 · 👍 {{ row.likeCount || 0 }}</p>
      <el-button @click="router.push(`/experiences/${row.id}`)">阅读</el-button>
      <el-button type="warning" plain @click="remove(row)">取消收藏</el-button>
    </el-card>
    <el-pagination v-if="total > 10" v-model:current-page="page" :page-size="10" :total="total" @current-change="load" />
  </div>
</template>
<style scoped>.page{max-width:1000px;margin:30px auto;padding:0 20px}.post{margin-bottom:16px}.post p{color:#718096}</style>
