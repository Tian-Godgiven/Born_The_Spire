import { ref } from 'vue'
import type { Reward } from '@/core/objects/reward/Reward'

/**
 * 奖励拦截弹窗
 *
 * 用途：某个遗物在战斗奖励展示前"看上"了一份奖励，弹出模态让玩家选择让/抢
 * 首个使用者：饲主的「饥饿的怪物」；接口做成通用，未来其他"拦奖励"遗物可复用
 *
 * 约定：
 *   yield  — 让给拦截者。调用方负责从 rewards 数组里 splice 掉这份 reward
 *   grab   — 抢过来。reward 保留在 rewards 数组里，走正常领取流程
 *   forced — 仅是 UI 单钮呈现，返回值仍是 'yield'（效果与"让"一致，不新增分支）
 */

export type InterceptChoice = 'yield' | 'grab'

export interface InterceptConfig {
    title: string
    description: string
    reward: Reward
    yieldLabel?: string
    grabLabel?: string
    forced?: boolean
    forcedLabel?: string
}

export const showInterceptModal = ref(false)
export const interceptConfig = ref<InterceptConfig | null>(null)

let interceptResolver: ((choice: InterceptChoice) => void) | null = null

export function showRewardIntercept(config: InterceptConfig): Promise<InterceptChoice> {
    interceptConfig.value = config
    showInterceptModal.value = true
    return new Promise<InterceptChoice>((resolve) => {
        interceptResolver = resolve
    })
}

export function resolveIntercept(choice: InterceptChoice) {
    showInterceptModal.value = false
    interceptConfig.value = null
    if (interceptResolver) {
        interceptResolver(choice)
        interceptResolver = null
    }
}
