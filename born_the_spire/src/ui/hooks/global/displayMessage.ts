import { ref } from 'vue'

/**
 * 全局屏幕中间显示消息的状态管理
 *
 * 用于在屏幕中间显示重要提示信息（如回合开始、敌人行动等）
 */

export type DisplayMessageConfig = {
    message: string
    duration?: number  // 显示时长（毫秒），默认3000ms
}

// 当前显示的消息
const currentMessage = ref<DisplayMessageConfig | null>(null)

/**
 * 显示屏幕中间的消息
 *
 * @param message 要显示的消息文本
 * @param duration 显示时长（毫秒），默认3000ms
 */
export function showDisplayMessage(message: string, duration: number = 3000) {
    currentMessage.value = {
        message,
        duration
    }
}

/**
 * 清除当前显示的消息
 */
export function clearDisplayMessage() {
    currentMessage.value = null
}

/**
 * 获取当前显示的消息（供组件使用）
 */
export function useDisplayMessage() {
    return {
        currentMessage,
        showDisplayMessage,
        clearDisplayMessage
    }
}
