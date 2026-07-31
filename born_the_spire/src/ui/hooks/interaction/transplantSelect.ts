import { ref, shallowRef } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import type { Organ } from '@/core/objects/target/Organ'

/**
 * 移植手术弹窗
 *
 * 用途：让玩家先从已装器官上选一张卡（阶段 1），再选一个目标器官（阶段 2）。
 * 首个使用者：event_transplant_surgery。
 *
 * 约定：
 *   groups     — 按 source 器官分组的卡（只应包含来源为 Organ 的卡）
 *   allOrgans  — 所有已装器官（阶段 2 显示时会自动排除 pickedFrom）
 */

export interface TransplantConfig {
    groups: Array<{ organ: Organ, cards: Card[] }>
    allOrgans: Organ[]
}

export interface TransplantResult {
    card: Card
    targetOrgan: Organ
}

export const showTransplantModal = ref(false)
// shallowRef：TransplantConfig 内嵌 Card/Organ 类，深度响应会 unwrap 掉 private 字段
export const transplantConfig = shallowRef<TransplantConfig | null>(null)

let transplantResolver: ((result: TransplantResult) => void) | null = null

export function showTransplantSelect(config: TransplantConfig): Promise<TransplantResult> {
    transplantConfig.value = config
    showTransplantModal.value = true
    return new Promise<TransplantResult>((resolve) => {
        transplantResolver = resolve
    })
}

export function resolveTransplant(result: TransplantResult) {
    showTransplantModal.value = false
    transplantConfig.value = null
    if (transplantResolver) {
        transplantResolver(result)
        transplantResolver = null
    }
}
