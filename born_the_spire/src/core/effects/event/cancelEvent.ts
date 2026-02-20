import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { ActionEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 取消事件
 *
 * 用于复活机制：在 before dead 触发器中取消死亡事件
 *
 * 使用方式：
 * 1. 在触发器回调中，通过 event 参数获取原始事件
 * 2. 触发器创建新事件，在 info 中传递原始事件引用
 * 3. cancelEvent 效果从 info 中获取原始事件并取消
 *
 * 注意：这个效果需要配合触发器使用，不能直接在卡牌/器官的 effectUnits 中使用
 */
export const cancelEvent: EffectFunc = (event, _effect) => {
    // 从 info 中获取要取消的目标事件
    const targetEvent = event.info.targetEvent as ActionEvent | undefined

    if (!targetEvent) {
        console.warn('[cancelEvent] 未找到目标事件，无法取消')
        return
    }

    // 取消目标事件
    targetEvent.cancel()
    newLog(["取消事件:", targetEvent.key])
}

/**
 * 取消当前触发的事件
 *
 * 这是一个简化版本，直接取消触发该效果的事件
 * 适用于在 before 触发器中直接取消当前事件
 *
 * 使用场景：
 * - 复活效果：before dead 时取消死亡
 * - 免疫效果：before damage 时取消伤害
 * - 阻挡效果：before 某事件时阻止其发生
 */
export const cancelCurrentEvent: EffectFunc = (event, _effect) => {
    // 获取触发该效果的原始事件（通过 parentEvent）
    const triggerEvent = event.parentEvent

    if (!triggerEvent) {
        console.warn('[cancelCurrentEvent] 未找到父事件，无法取消')
        return
    }

    // 取消父事件
    triggerEvent.cancel()
    newLog(["取消事件:", triggerEvent.key])
}
