<script setup>
import { ref, onMounted } from 'vue'
import { getStatsOverview } from '@/api/admin'

const loading = ref(true)
const stats = ref(null)

onMounted(async () => {
  try {
    const res = await getStatsOverview()
    stats.value = res.data
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="admin-stats" v-loading="loading">
    <el-row :gutter="16" v-if="stats">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总用户数" :value="stats.totalUsers || 0">
            <template #prefix>
              <el-icon style="color: #409eff;"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日新增用户" :value="stats.todayNewUsers || 0">
            <template #prefix>
              <el-icon style="color: #67c23a;"><UserFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总面试数" :value="stats.totalInterviews || 0">
            <template #prefix>
              <el-icon style="color: #e6a23c;"><Microphone /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日新增面试" :value="stats.todayNewInterviews || 0">
            <template #prefix>
              <el-icon style="color: #f56c6c;"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;" v-if="stats">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总经验数" :value="stats.totalExperiences || 0">
            <template #prefix>
              <el-icon style="color: #909399;"><Document /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总评论数" :value="stats.totalComments || 0">
            <template #prefix>
              <el-icon style="color: #909399;"><ChatDotRound /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均面试评分" :value="stats.averageScore || 0" :precision="1">
            <template #prefix>
              <el-icon style="color: #e6a23c;"><TrendCharts /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="处理中面试" :value="stats.processingInterviews || 0">
            <template #prefix>
              <el-icon style="color: #409eff;"><Loading /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 状态分布 -->
    <el-row :gutter="16" style="margin-top: 16px;" v-if="stats">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="已完成面试" :value="stats.completedInterviews || 0">
            <template #prefix>
              <el-icon style="color: #67c23a;"><CircleCheck /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="失败面试" :value="stats.failedInterviews || 0">
            <template #prefix>
              <el-icon style="color: #f56c6c;"><CircleClose /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="今日新增经验" :value="stats.todayNewExperiences || 0">
            <template #prefix>
              <el-icon style="color: #67c23a;"><Document /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
