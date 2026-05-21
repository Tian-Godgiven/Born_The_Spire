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

// 是否必须领取所有奖励才能前进
export const requireAllRewards = ref(false)

// 领取奖励后是否自动导航到下一步
export const navigateOnProceed = ref(true)

// 奖励完成的 Promise resolver
let rewardResolver: (() => void) | null = null

/**
 * 显示奖励选项
 */
export interface ShowRewardsOptions {
    /** 领取后是否自动导航（默认 true） */
    navigate?: boolean
    /** 是否必须领取所有奖励才能前进（默认 false） */
    requireAll?: boolean
}

/**
 * 显示奖励并等待玩家领取
 * @param rewards 奖励列表
 * @param title 奖励标题（可选）
 * @param description 奖励描述（可选）
 * @param options 额外选项
 * @returns Promise，当所有奖励领取完成后 resolve
 */
export function showRewards(
    rewards: Reward[],
    title?: string,
    description?: string,
    options?: ShowRewardsOptions
): Promise<void> {
    currentRewards.value = rewards
    rewardTitle.value = title || "获得奖励"
    rewardDescription.value = description || ""
    navigateOnProceed.value = options?.navigate ?? true
    requireAllRewards.value = options?.requireAll ?? false
    showRewardUI.value = true

    return new Promise<void>((resolve) => {
        rewardResolver = resolve
    })
}

/**
 * 处理互斥组逻辑：领取某奖励后，锁定同组其他奖励
 */
export function handleExclusiveGroup(claimedReward: Reward) {
    if (!claimedReward.exclusiveGroup) return

    for (const reward of currentRewards.value) {
        if (
            reward !== claimedReward &&
            reward.exclusiveGroup === claimedReward.exclusiveGroup &&
            reward.isAvailable()
        ) {
            reward.lock()
        }
    }
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
    requireAllRewards.value = false
}

/**
 * 清除当前奖励（用于取消或错误处理）
 */
export function clearRewards() {
    currentRewards.value = []
    showRewardUI.value = false
    rewardTitle.value = ""
    rewardDescription.value = ""
    requireAllRewards.value = false
    rewardResolver = null
}

/**
 * 检查是否所有奖励都已领取（或被锁定）
 */
export function areAllRewardsClaimed(): boolean {
    return currentRewards.value.every(reward => reward.isClaimed() || reward.isLocked())
}

/**
 * 检查是否可以前进
 * requireAll 模式下，所有奖励必须已领取或被锁定
 */
export function canProceed(): boolean {
    if (!requireAllRewards.value) return true
    return areAllRewardsClaimed()
}
