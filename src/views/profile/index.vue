<script setup>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '@/store/useUserStore'
import { updateProfile, changePassword } from '@/api/auth'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

// 个人信息表单
const profileFormRef = ref(null)
const profileLoading = ref(false)
const profileForm = reactive({
  nickname: userInfo.value?.nickname || ''
})

const profileRules = {
  nickname: [
    { max: 30, message: '昵称不超过30个字符', trigger: 'blur' }
  ]
}

// 密码表单
const passwordFormRef = ref(null)
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 更新昵称
async function handleUpdateProfile() {
  try {
    await profileFormRef.value.validate()
  } catch {
    return
  }

  profileLoading.value = true
  try {
    await updateProfile({ nickname: profileForm.nickname })
    ElMessage.success('昵称修改成功')
    await userStore.fetchUserInfo()
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    profileLoading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  passwordLoading.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>个人信息</h1>
      <p>管理你的账号信息和安全设置</p>
    </div>

    <div class="profile-grid">
      <!-- 左侧：基本信息 -->
      <div class="profile-sidebar">
        <div class="user-card">
          <el-avatar :size="72" :src="userInfo?.avatar" icon="UserFilled" />
          <h3 class="user-name">{{ userInfo?.nickname || userInfo?.username }}</h3>
          <p class="user-email">{{ userInfo?.email }}</p>
          <el-tag :type="userInfo?.role === 1 ? 'danger' : 'info'" size="small" effect="plain" round>
            {{ userInfo?.role === 1 ? '管理员' : '普通用户' }}
          </el-tag>
        </div>
      </div>

      <!-- 右侧：设置 -->
      <div class="profile-main">
        <!-- 修改昵称 -->
        <div class="form-card">
          <h3 class="form-title">修改昵称</h3>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="80px"
            style="max-width: 400px;"
          >
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 修改密码 -->
        <div class="form-card">
          <h3 class="form-title">修改密码</h3>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 400px;"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 网格布局 */
.profile-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
}

/* 用户卡片 */
.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.user-name {
  margin: 16px 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.user-email {
  margin: 0 0 12px;
  font-size: 13px;
  color: #909399;
}

/* 表单卡片 */
.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.form-title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
