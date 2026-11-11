<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { sendCode, register } from '@/api/auth'
import { useUserStore } from '@/store/useUserStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref(null)
const loading = ref(false)
const codeLoading = ref(false)
const codeCountdown = ref(0)

const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  code: ''
})

const registerRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

async function handleSendCode() {
  if (!registerForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  codeLoading.value = true
  try {
    await sendCode({ email: registerForm.email })
    ElMessage.success('验证码已发送')
    codeCountdown.value = 60
    const timer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    codeLoading.value = false
  }
}

async function handleRegister() {
  try {
    await registerFormRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await register({
      email: registerForm.email,
      username: registerForm.username,
      password: registerForm.password,
      code: registerForm.code
    })
    ElMessage.success('注册成功')
    // 自动登录
    if (res.data?.token) {
      await userStore.login({
        account: registerForm.username,
        password: registerForm.password
      })
      router.replace('/')
    } else {
      // 如果注册接口未返回 token，用手动登录
      await userStore.login({
        account: registerForm.username,
        password: registerForm.password
      })
      router.replace('/')
    }
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="register-title">注册账号</h2>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="邮箱"
            prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="code">
          <div class="code-row">
            <el-input
              v-model="registerForm.code"
              placeholder="验证码"
              prefix-icon="Key"
            />
            <el-button
              :loading="codeLoading"
              :disabled="codeCountdown > 0"
              @click="handleSendCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        <div class="register-footer">
          <span>已有账号？</span>
          <el-link type="primary" @click="goLogin">返回登录</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(117, 224, 211, 0.25), transparent 25rem),
    radial-gradient(circle at 82% 82%, rgba(15, 116, 144, 0.4), transparent 30rem),
    linear-gradient(135deg, #062c38 0%, #0d5262 54%, #08727c 100%);
}

.register-container::before,
.register-container::after {
  content: '';
  position: absolute;
  border: 1px solid rgba(219, 255, 252, 0.14);
  border-radius: 50%;
  pointer-events: none;
}

.register-container::before { width: 34rem; height: 34rem; top: -17rem; right: -9rem; }
.register-container::after { width: 21rem; height: 21rem; bottom: -10rem; left: -8rem; }

.register-card {
  position: relative;
  z-index: 1;
  width: min(400px, calc(100% - 32px));
  padding: 36px 40px 32px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(2, 31, 39, 0.3);
}

.register-title {
  text-align: center;
  margin-bottom: 26px;
  color: #143c47;
  font-size: 26px;
  letter-spacing: 0.03em;
}

.register-card :deep(.el-input__wrapper) { min-height: 42px; border-radius: 10px; background: #f7fbfb; }
.register-card :deep(.el-button--primary) { min-height: 42px; border-radius: 10px; }

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.register-footer {
  text-align: center;
  margin-top: -8px;
  color: #658087;
}
</style>
