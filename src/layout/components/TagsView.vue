<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/usePermissionStore'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

const visitedViews = ref([])
const contextMenu = ref({ visible: false, left: 0, top: 0 })
const selectedTag = ref(null)
const scrollWrapper = ref(null)

// 固定标签（首页）
const affixTags = ref([])

// 从路由配置中获取固定标签
function getAffixTags() {
  const routes = permissionStore.routes
  const tags = []
  // admin 首页
  tags.push({
    path: '/management/stats',
    name: 'AdminStats',
    meta: { title: '首页' },
    fullPath: '/management/stats'
  })
  return tags
}

function isActive(tag) {
  return tag.path === route.path
}

function addView(view) {
  if (visitedViews.value.some(v => v.path === view.path)) return
  visitedViews.value.push({
    path: view.path,
    name: view.name,
    meta: { ...view.meta },
    fullPath: view.fullPath || view.path
  })
}

function addVisitedView() {
  const { path, name, meta, fullPath } = route
  if (meta?.hidden) return
  addView({ path, name, meta, fullPath })
}

// 关闭标签
function closeSelectedTag(view) {
  const index = visitedViews.value.findIndex(v => v.path === view.path)
  if (index === -1) return
  visitedViews.value.splice(index, 1)

  // 如果关闭的是当前标签，跳转到最后一个标签
  if (isActive(view)) {
    const lastView = visitedViews.value[visitedViews.value.length - 1]
    if (lastView) {
      router.push(lastView.fullPath || lastView.path)
    } else {
      router.push('/management/stats')
    }
  }
}

// 关闭其他标签
function closeOthersTags() {
  if (!selectedTag.value) return
  visitedViews.value = visitedViews.value.filter(
    v => v.meta?.title === '首页' || v.path === selectedTag.value.path
  )
  if (!isActive(selectedTag.value)) {
    router.push(selectedTag.value.fullPath || selectedTag.value.path)
  }
}

// 关闭所有标签
function closeAllTags() {
  visitedViews.value = visitedViews.value.filter(v => v.meta?.title === '首页')
  router.push('/management/stats')
}

// 刷新当前标签
function refreshSelectedTag() {
  if (!selectedTag.value) return
  const { fullPath } = selectedTag.value
  router.replace({ path: '/redirect' + fullPath })
}

// 右键菜单
function openContextMenu(e, view) {
  e.preventDefault()
  selectedTag.value = view
  contextMenu.value = {
    visible: true,
    left: e.clientX,
    top: e.clientY
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

// 滚动到当前标签
function moveToCurrentTag() {
  nextTick(() => {
    const tags = document.querySelectorAll('.tags-view-item')
    for (const tag of tags) {
      if (tag.dataset.path === route.path) {
        tag.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        break
      }
    }
  })
}

// 存储到 sessionStorage
function saveViews() {
  sessionStorage.setItem('tagsView', JSON.stringify(visitedViews.value))
}

function loadViews() {
  const stored = sessionStorage.getItem('tagsView')
  if (stored) {
    try {
      visitedViews.value = JSON.parse(stored)
    } catch (e) {
      visitedViews.value = []
    }
  }
}

// 初始化
onMounted(() => {
  affixTags.value = getAffixTags()
  loadViews()
  // 确保固定标签存在
  for (const tag of affixTags.value) {
    addView(tag)
  }
  addVisitedView()
  // 点击其他区域关闭右键菜单
  document.addEventListener('click', closeContextMenu)
})

// 监听路由变化
watch(() => route.path, () => {
  addVisitedView()
  moveToCurrentTag()
}, { immediate: false })

watch(visitedViews, () => {
  saveViews()
}, { deep: true })
</script>

<template>
  <div class="tags-view-container">
    <div ref="scrollWrapper" class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :to="tag.fullPath || tag.path"
        :class="['tags-view-item', { active: isActive(tag) }]"
        :data-path="tag.path"
        @contextmenu.prevent="openContextMenu($event, tag)"
      >
        {{ tag.meta?.title }}
        <el-icon
          v-if="tag.meta?.title !== '首页'"
          class="tag-close"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <Close />
        </el-icon>
      </router-link>
    </div>

    <!-- 右键菜单 -->
    <teleport to="body">
      <ul
        v-show="contextMenu.visible"
        :style="{ left: contextMenu.left + 'px', top: contextMenu.top + 'px' }"
        class="contextmenu"
      >
        <li @click="refreshSelectedTag">刷新</li>
        <li v-if="selectedTag?.meta?.title !== '首页'" @click="closeSelectedTag(selectedTag)">关闭</li>
        <li @click="closeOthersTags">关闭其他</li>
        <li @click="closeAllTags">关闭所有</li>
      </ul>
    </teleport>
  </div>
</template>

<style scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);
}

.tags-view-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding: 0 8px;
  gap: 4px;
}

.tags-view-wrapper::-webkit-scrollbar {
  height: 0;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: #495060;
  background: #fff;
  border: 1px solid #d8dce5;
  border-radius: 3px;
  text-decoration: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.tags-view-item:hover {
  color: #409eff;
}

.tags-view-item.active {
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
}

.tag-close {
  font-size: 12px;
  border-radius: 50%;
  transition: all 0.2s;
}

.tag-close:hover {
  background-color: rgba(0, 0, 0, 0.15);
}
</style>

<style>
/* 右键菜单样式（非 scoped，因为 teleport 到 body） */
.contextmenu {
  position: fixed;
  z-index: 3000;
  margin: 0;
  padding: 5px 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
  list-style: none;
  font-size: 12px;
  color: #333;
}

.contextmenu li {
  margin: 0;
  padding: 7px 16px;
  cursor: pointer;
}

.contextmenu li:hover {
  background: #eee;
}
</style>
