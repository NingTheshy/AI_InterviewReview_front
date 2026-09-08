import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarOpened = ref(true)
  const device = ref('desktop') // desktop | mobile

  // Actions
  function toggleSidebar() {
    sidebarOpened.value = !sidebarOpened.value
  }

  function closeSidebar() {
    sidebarOpened.value = false
  }

  function openSidebar() {
    sidebarOpened.value = true
  }

  function toggleDevice(val) {
    device.value = val
  }

  return {
    sidebarOpened, device,
    toggleSidebar, closeSidebar, openSidebar, toggleDevice
  }
})
