import { ref } from 'vue'

/**
 * 战斗失败UI控制
 */

// 是否显示失败弹窗
export const showDefeatModal = ref(false)

/**
 * 显示战斗失败弹窗
 */
export function showBattleDefeat() {
    showDefeatModal.value = true
}

/**
 * 隐藏战斗失败弹窗
 */
export function hideBattleDefeat() {
    showDefeatModal.value = false
}
