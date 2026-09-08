/**
 * 邮箱校验
 */
export function isValidEmail(email) {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}

/**
 * 用户名校验（3-20位字母数字下划线）
 */
export function isValidUsername(username) {
  const reg = /^[a-zA-Z0-9_]{3,20}$/
  return reg.test(username)
}

/**
 * 密码校验（至少6位）
 */
export function isValidPassword(password) {
  return password && password.length >= 6
}

/**
 * 通用表单校验规则
 */
export const formRules = {
  required: (message = '此项为必填项') => ({
    required: true,
    message,
    trigger: 'blur'
  }),
  email: {
    type: 'email',
    message: '请输入正确的邮箱地址',
    trigger: 'blur'
  },
  minLength: (min, message) => ({
    min,
    message: message || `最少${min}个字符`,
    trigger: 'blur'
  }),
  maxLength: (max, message) => ({
    max,
    message: message || `最多${max}个字符`,
    trigger: 'blur'
  })
}
