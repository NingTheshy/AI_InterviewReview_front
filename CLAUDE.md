# AI 面试复盘系统 - 前端

## 角色

你是一名资深 Vue3 前端架构师，擅长从零搭建企业级管理后台前端项目。

## 技术栈

- **语言**: JavaScript（非 TypeScript）
- **框架**: Vue 3.4 + Composition API + `<script setup>`
- **构建工具**: Vite 5
- **UI 框架**: Element Plus 2.7 + @element-plus/icons-vue
- **状态管理**: Pinia 2.1（setup store 语法）
- **路由**: Vue Router 4.3（动态路由）
- **HTTP**: Axios 1.7
- **图表**: ECharts 5.5（雷达图）
- **进度条**: NProgress
- **样式**: SCSS

## 核心材料

- **后端项目**: `../AI_InterviewReview/`（Spring Boot 多模块，47 个接口）
- **需求文档**: `md/AI面试复盘系统-需求文档.md`
- **开发文档**: `md/AI面试复盘系统-开发文档.md`
- **数据库设计**: `md/AI面试复盘系统-数据库设计文档.md`
- **技术架构**: `md/AI面试复盘系统-技术架构设计文档.md`

## 目录结构

```
src/
  api/              # 按模块分文件的 API 接口定义
  assets/           # 图片、图标、全局样式
  components/       # 公共组件
  directive/        # 自定义指令（v-permission）
  layout/           # 主布局（Sidebar、Navbar、AppMain、TagsView）
  router/           # 路由配置（含动态路由生成）
  store/            # Pinia 模块（user、app、permission）
  utils/            # 工具函数（request 封装、auth 工具）
  views/            # 业务页面
  App.vue
  main.js
public/
.env.development
.env.production
package.json
vite.config.js
```

## 后端 API 模块清单（47 个接口）

### Auth 模块 `/auth`
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/auth/send-code` | 发送邮箱验证码 | 无 |
| POST | `/auth/register` | 注册 | 无 |
| POST | `/auth/login` | 登录 | 无 |
| POST | `/auth/logout` | 登出 | 无 |
| GET | `/auth/profile` | 获取用户信息 | 需要 |
| PUT | `/auth/profile` | 更新用户信息 | 需要 |
| PUT | `/auth/password` | 修改密码 | 需要 |

### Interview 模块 `/interviews`
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/interviews/upload` | 上传面试（音频+简历+JD） | 需要 |
| GET | `/interviews` | 面试列表（分页/筛选/排序） | 需要 |
| GET | `/interviews/{id}` | 面试详情（含题目评分） | 需要 |
| DELETE | `/interviews/{id}` | 删除面试 | 需要 |
| GET | `/interviews/{id}/status` | 处理进度查询 | 需要 |
| POST | `/interviews/{id}/retry` | 重试失败面试 | 需要 |

### Note 模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/interviews/{id}/note` | 获取面试笔记 | 需要 |
| PUT | `/interviews/{id}/note` | 保存面试笔记 | 需要 |
| GET | `/interviews/{id}/questions/{qid}/note` | 获取题目笔记 | 需要 |
| PUT | `/interviews/{id}/questions/{qid}/note` | 保存题目笔记 | 需要 |

### Favorite 模块 `/favorites`
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/favorites` | 收藏题目 | 需要 |
| DELETE | `/favorites/{id}` | 取消收藏 | 需要 |
| GET | `/favorites` | 收藏列表 | 需要 |

### Share 模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/interviews/{id}/share` | 生成分享链接/发布经验 | 需要 |
| GET | `/interviews/{id}/shares` | 分享记录列表 | 需要 |
| DELETE | `/shares/{token}` | 撤销分享/下架经验 | 需要 |
| PUT | `/shares/{token}/public` | 切换公开状态 | 需要 |
| GET | `/share/{token}` | 访问分享页（只读） | 无 |

### Experience 模块 `/experiences`
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/experiences` | 经验广场列表 | 无 |
| GET | `/experiences/{token}` | 经验详情 | 无 |
| GET | `/experiences/{token}/comments` | 评论列表 | 无 |
| POST | `/experiences/{token}/comments` | 发表评论 | 需要 |
| DELETE | `/comments/{id}` | 删除评论 | 需要 |

### AI Config 模块 `/ai-configs`（仅管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/ai-configs` | AI 配置列表 |
| GET | `/ai-configs/{id}` | 配置详情 |
| POST | `/ai-configs` | 创建配置 |
| PUT | `/ai-configs/{id}` | 更新配置 |
| DELETE | `/ai-configs/{id}` | 删除配置 |
| PUT | `/ai-configs/{id}/default` | 设为默认 |

### Admin 模块 `/admin`（仅管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/users` | 用户列表 |
| GET | `/admin/users/{id}` | 用户详情 |
| PUT | `/admin/users/{id}/status` | 启用/禁用用户 |
| PUT | `/admin/users/{id}/role` | 修改用户角色 |
| GET | `/admin/stats/overview` | 系统统计概览 |
| GET | `/admin/interviews` | 所有面试列表 |
| GET | `/admin/experiences` | 所有经验列表 |
| PUT | `/admin/experiences/{token}/status` | 下架/恢复经验 |
| GET | `/admin/comments` | 所有评论列表 |
| DELETE | `/admin/comments/{id}` | 删除评论 |

### File 模块
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/files/{filename}` | 文件访问（支持 Range） | 无 |

## 前端页面清单（11 个）

1. **登录页** `/login` — 独立于主布局
2. **注册页** `/register` — 独立于主布局
3. **首页（面试列表）** `/` — 搜索、筛选、分页、排序
4. **上传面试** `/interview/upload` — 音频+简历+JD 表单
5. **面试复盘详情** `/interview/:id` — 音频播放器、转写文本、题目评分、雷达图、AI 建议
6. **我的收藏** `/favorites` — 收藏题目列表
7. **分享页** `/share/:token` — 只读，隐藏音频和笔记
8. **经验广场** `/experiences` — 公开经验列表
9. **经验详情** `/experiences/:token` — 题目+评分+评论
10. **AI 配置** `/admin/ai-config` — 管理员
11. **管理后台** `/admin` — 用户管理、面试管理、经验管理、评论管理、统计

## 统一响应格式

```json
{ "code": 200, "message": "success", "data": {} }
```

分页响应 data 内含 `records`, `total`, `page`, `size`。

## 核心编码规范

### Vue 组件
- 使用 `<script setup>` Composition API（非 TypeScript）
- Props 用 `defineProps`，Emits 用 `defineEmits`
- 组件名 PascalCase：`UserProfile.vue`、`InterviewCard.vue`
- 公共组件前缀：`BaseButton.vue`、`AppHeader.vue`

### Pinia Store
- 使用 setup store 语法（组合式 API 风格）
- 三个核心 store：`useUserStore`、`useAppStore`、`usePermissionStore`

### API 层
- `src/api/request.js` — Axios 实例、拦截器、token 注入、错误处理
- `src/api/auth.js` — 认证模块
- `src/api/interview.js` — 面试模块
- `src/api/favorite.js` — 收藏模块
- `src/api/share.js` — 分享模块
- `src/api/experience.js` — 经验广场
- `src/api/comment.js` — 评论模块
- `src/api/aiConfig.js` — AI 配置（管理员）
- `src/api/admin.js` — 管理后台

### 样式
- Element Plus 默认主题 + SCSS 变量覆盖
- 全局样式在 `assets/styles/`
- 参考若依管理后台视觉风格
- 统一间距、对齐

### 交互细节
- 表格加载状态、空数据提示
- 操作二次确认（`ElMessageBox.confirm`）
- 成功/失败消息提示（`ElMessage`）
- 表单重置功能

## Vite 代理配置

所有 API 路径代理到 `http://localhost:8080`：
`/auth`, `/interviews`, `/favorites`, `/shares`, `/share`, `/experiences`, `/comments`, `/ai-configs`, `/admin`, `/files`

## 权限模型

- 两个固定角色：`admin`（管理员）、`user`（普通用户）
- 8 个权限标识：`user:list`, `user:manage`, `ai_config:list`, `ai_config:manage`, `interview:view_all`, `experience:manage`, `comment:manage`, `system:stats`
- 管理员接口 `/admin/**` 需 `@PreAuthorize("hasRole('ADMIN')")`
- 公开接口：`/share/{token}`, `/experiences`, `/experiences/{token}`, `/experiences/{token}/comments`

## 评分维度

| 维度 | 字段 | 权重 |
|------|------|------|
| 内容质量 | dimensionContent | 0.25 |
| 逻辑性 | dimensionLogic | 0.20 |
| 表达能力 | dimensionExpression | 0.15 |
| 专业度 | dimensionProfessional | 0.25 |
| 沟通能力 | dimensionCommunication | 0.15 |

## 可用命令

- `/component` — 创建 Vue 3 组件
- `/page` — 创建页面视图（含路由注册）
- `/store` — 创建 Pinia store
- `/api` — 创建 API 服务模块
- `/review` — 代码审查
