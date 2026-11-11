<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/useUserStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  account: '',
  password: ''
})

const loginRules = {
  account: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await loginFormRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/interviews'
    router.replace(redirect)
  } catch (error) {
    // 错误已在 request 拦截器中处理
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">AI面试复盘系统</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
      >
        <el-form-item prop="account">
          <el-input
            v-model="loginForm.account"
            placeholder="用户名或邮箱"
            prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 14%, rgba(117, 224, 211, 0.28), transparent 25rem),
    radial-gradient(circle at 82% 82%, rgba(15, 116, 144, 0.42), transparent 30rem),
    linear-gradient(135deg, #062c38 0%, #0d5262 54%, #08727c 100%);
}

.login-container::before,
.login-container::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(219, 255, 252, 0.14);
  border-radius: 50%;
  pointer-events: none;
}

.login-container::before { width: 32rem; height: 32rem; top: -16rem; right: -8rem; }
.login-container::after { width: 22rem; height: 22rem; bottom: -12rem; left: -8rem; }

.login-card {
  position: relative;
  z-index: 1;
  width: min(400px, calc(100% - 32px));
  padding: 42px 40px 36px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(2, 31, 39, 0.3);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #143c47;
  font-size: 26px;
  letter-spacing: 0.03em;
}

.login-card :deep(.el-input__wrapper) { min-height: 44px; border-radius: 10px; background: #f7fbfb; }
.login-card :deep(.el-button--primary) { min-height: 44px; border-radius: 10px; }

.login-footer {
  text-align: center;
  margin-top: -8px;
  color: #658087;
}
</style>
