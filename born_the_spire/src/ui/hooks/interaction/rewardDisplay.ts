import { ref } from 'vue'
import { Reward } from '@/core/objects/reward/Reward'
import { newLog } from '@/ui/hooks/global/log'
import { rewardRowAddonRegistry } from '@/static/registry/rewardRowAddonRegistry'

const SELECT_REWARD_TYPES = new Set(['organSelect', 'relicSelect', 'cardSelect'])

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
 * 按配置发放战利品并打开领取界面。药水栏满时领不走，可先丢掉再领。
 * 战斗奖励已经自己组 Reward 实例，继续走 showRewards；事件/效果用这个。
 */
export async function grantLoot(
    configs: any[],
    title?: string,
    description?: string,
    options?: ShowRewardsOptions
): Promise<void> {
    const { rewardRegistry } = await import("@/static/registry/rewardRegistry")
    const rewards = rewardRegistry.createRewards(configs)
    if (rewards.length === 0) return
    await showRewards(rewards, title, description, options)
}

/**
 * 显示奖励并等待玩家领取。已有 Reward 实例时用这个（战斗结算）。
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
    releaseRewardWaiter()

    currentRewards.value = []
    showRewardUI.value = false
    rewardTitle.value = ""
    rewardDescription.value = ""
    requireAllRewards.value = false
    rewardRowAddonRegistry.dismissAll()
}

/** 打开地图时先藏起奖励，不清空列表 */
export function hideRewardUI() {
    showRewardUI.value = false
}

/** 关掉地图后，还有没领完的就重新显示 */
export function restoreRewardUI() {
    if (currentRewards.value.length > 0) {
        showRewardUI.value = true
    }
}

/** 让 showRewards 的等待结束，房间 complete 才能继续；不清空奖励 */
export function releaseRewardWaiter() {
    if (rewardResolver) {
        rewardResolver()
        rewardResolver = null
    }
}

async function claimRemainingRewards() {
    await rewardRowAddonRegistry.settleAll()
    for (const reward of currentRewards.value) {
        if (reward.isClaimed() || reward.isLocked() || reward.isClaimBlocked()) continue
        if (SELECT_REWARD_TYPES.has(reward.type)) {
            reward.markAsClaimed()
            continue
        }
        await reward.claim()
        if (!reward.isClaimed()) {
            newLog([`${reward.getDisplayTitle()} 未能领取（栏位可能已满），已跳过`])
            reward.markAsClaimed()
        }
    }
}

/** 真正进入下一房间时结算剩余奖励并清空 */
export async function settlePendingRewards() {
    if (currentRewards.value.length === 0) return
    await claimRemainingRewards()
    confirmRewards()
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
    rewardRowAddonRegistry.dismissAll()
}

/**
 * 检查是否所有奖励都已领取（或被锁定）
 */
export function areAllRewardsClaimed(): boolean {
    return currentRewards.value.every(reward =>
        reward.isClaimed() || reward.isLocked() || reward.isClaimBlocked()
    )
}

/**
 * 检查是否可以前进
 * requireAll 模式下，所有奖励必须已领取或被锁定
 */
export function canProceed(): boolean {
    if (!requireAllRewards.value) return true
    return areAllRewardsClaimed()
}
