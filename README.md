# AI面试复盘系统

基于 Vue 3 + Vite 构建的 AI 面试复盘系统前端，提供面试记录管理、经验分享、AI 配置管理和数据统计分析等功能。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **UI 组件库**: Element Plus 2（中文语言包）
- **状态管理**: Pinia 3
- **路由**: Vue Router 4
- **HTTP 请求**: Axios
- **图表**: ECharts 6
- **CSS 预处理器**: Sass
- **进度条**: NProgress

## 功能模块

### 用户端
- **登录 / 注册** — 用户认证，支持注册后登录
- **面试记录** — 查看、上传面试复盘记录（支持文件上传）
- **经验广场** — 浏览和分享面试经验，支持公开访问
- **收藏管理** — 收藏感兴趣的面试经验
- **个人中心** — 查看和编辑个人信息
- **分享页面** — 通过 Token 链接分享面试复盘内容

### 管理端
- **面试管理** — 管理所有面试记录
- **用户管理** — 管理系统用户
- **经验管理** — 审核和管理面试经验
- **评论管理** — 管理用户评论
- **AI 配置** — 配置 AI 相关参数
- **数据统计** — 可视化数据统计分析（ECharts）

## 项目结构

```
src/
├── api/                # API 接口层
│   ├── admin.js        # 管理端接口
│   ├── aiConfig.js     # AI 配置接口
│   ├── auth.js         # 认证接口
│   ├── experience.js   # 面试经验接口
│   ├── favorite.js     # 收藏接口
│   ├── interview.js    # 面试记录接口
│   ├── request.js      # Axios 实例封装
│   └── share.js        # 分享接口
├── assets/styles/      # 全局样式
├── components/         # 公共组件
├── directive/          # 自定义指令（权限控制）
├── layout/             # 布局组件
├── router/             # 路由配置
│   ├── index.js        # 路由定义
│   └── guards.js       # 路由守卫
├── store/              # Pinia 状态管理
│   ├── index.js
│   ├── useAppStore.js
│   ├── usePermissionStore.js
│   └── useUserStore.js
├── views/              # 页面视图
│   ├── admin/          # 管理端页面
│   │   ├── aiConfig.vue
│   │   ├── comments.vue
│   │   ├── experiences.vue
│   │   ├── interviews.vue
│   │   ├── stats.vue
│   │   └── users.vue
│   ├── error/          # 错误页面
│   │   └── 404.vue
│   ├── experience/     # 经验广场
│   ├── favorites/      # 收藏
│   ├── interview/      # 面试记录
│   ├── login/          # 登录
│   ├── profile/        # 个人中心
│   ├── register/       # 注册
│   └── share/          # 分享页
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## 快速开始

### 环境要求

- Node.js >= 18
- 后端服务运行在 `http://localhost:8080`

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`，API 请求会自动代理到 `http://localhost:8080`。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 代理配置

开发环境下，以下 API 路径会代理到后端 `http://localhost:8080`：

- `/auth` — 认证相关
- `/interviews` — 面试记录
- `/favorites` — 收藏
- `/shares` / `/share` — 分享
- `/experiences` — 面试经验
- `/comments` — 评论
- `/ai-configs` — AI 配置
- `/admin` — 管理端
- `/files` — 文件上传

可在 `vite.config.js` 中修改代理配置。
