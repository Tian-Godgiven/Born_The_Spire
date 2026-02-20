/**
 * 印记配置类型定义
 * 印记是玩家在游戏中获得的特殊标记，具有独特的效果
 */

import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { TriggerMap } from "@/core/types/object/trigger"

/**
 * 印记配置接口
 */
export interface MarkConfig {
    key: string                    // 印记唯一标识，如 "mark_blood"
    name: string                   // 印记名称，如 "红色印记"
    description: string            // 印记描述

    // UI 显示
    displayText: string            // 左上角显示的文本，如 "已染血"
    displayColor: string           // 文本颜色，如 "red"

    // 对应的 status key
    statusKey: string              // 如 "ifBloodMark"

    // 获得印记时触发的事件（可选）
    onGain?: {
        key: string                // 事件key，如 "bloodMark"
        effectUnits: EffectUnit[]  // 效果列表
    }

    // 印记的被动效果（可选，通过 trigger 实现）
    triggers?: TriggerMap
}
