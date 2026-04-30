import { ref } from 'vue'
import { Reward } from '@/core/objects/reward/Reward'

/**
 * 通用奖励展示系统
 * 用于展示和领取各种奖励（战斗、事件、宝箱等）
 */

// 当前展示的奖励列表
export const currentRewards = ref<Reward[]>([])

// 是否显示奖励界面
export const showRewardUI = ref(false)

// 奖励标题（可选）
export const rewardTitle = ref<string>("")

// 奖励描述（可选）
export const rewardDescription = ref<string>("")

// 奖励完成的 Promise resolver
let rewardResolver: (() => void) | null = null

// 领取奖励后是否自动导航到下一步
export const navigateOnProceed = ref(true)

/**
 * 显示奖励并等待玩家领取
 * @param rewards 奖励列表
 * @param title 奖励标题（可选）
 * @param description 奖励描述（可选）
 * @param options 额外选项
 * @param options.navigate 领取后是否自动导航（默认 true）
 * @returns Promise，当所有奖励领取完成后 resolve
 */
export function showRewards(
    rewards: Reward[],
    title?: string,
    description?: string,
    options?: { navigate?: boolean }
): Promise<void> {
    currentRewards.value = rewards
    rewardTitle.value = title || "获得奖励"
    rewardDescription.value = description || ""
    navigateOnProceed.value = options?.navigate ?? true
    showRewardUI.value = true

    return new Promise<void>((resolve) => {
        rewardResolver = resolve
    })
}

/**
 * 确认所有奖励已领取，关闭界面
 */
export function confirmRewards() {
    if (rewardResolver) {
        rewardResolver()
        rewardResolver = null
    }

    currentRewards.value = []
    showRewardUI.value = false
    rewardTitle.value = ""
    rewardDescription.value = ""
}

/**
 * 清除当前奖励（用于取消或错误处理）
 */
export function clearRewards() {
    currentRewards.value = []
    showRewardUI.value = false
    rewardTitle.value = ""
    rewardDescription.value = ""
    rewardResolver = null
}

/**
 * 检查是否所有奖励都已领取
 */
export function areAllRewardsClaimed(): boolean {
    return currentRewards.value.every(reward => reward.isClaimed())
}
