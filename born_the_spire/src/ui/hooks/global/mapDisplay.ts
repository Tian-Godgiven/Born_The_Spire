import { ref } from 'vue'

/**
 * 地图显示状态
 */
export const isMapVisible = ref(false)

/**
 * 切换地图显示/隐藏
 */
export function toggleMap() {
    isMapVisible.value = !isMapVisible.value
}

/**
 * 显示地图
 */
export function showMap() {
    isMapVisible.value = true
}

/**
 * 隐藏地图
 */
export function hideMap() {
    isMapVisible.value = false
}
