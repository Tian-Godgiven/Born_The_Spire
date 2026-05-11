/**
 * 修改卡牌重复打出次数
 * 用于双发等效果：在 before useCard 时检查卡牌 tag，修改 info.repeat
 *
 * params:
 *   requiredTag: string    — 卡牌需要有的 tag（如 "attack"），不指定则对所有卡牌生效
 *   repeat: number         — 设置重复次数（覆盖）
 *   addRepeat: number      — 增加重复次数（累加），优先于 repeat
 *   consumeStateKey: string — 生效后消耗的状态 key（如 "doubleTap"），每次消耗1层
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { getStateModifier } from "@/core/objects/system/modifier/StateModifier"
import { newLog } from "@/ui/hooks/global/log"

export const modifyRepeat: EffectFunc = (event, effect) => {
    const { requiredTag, repeat, addRepeat, consumeStateKey } = effect.params || {}

    // 获取原始 useCard 事件（通过 parentEvent）
    const useCardEvent = event.parentEvent
    if (!useCardEvent) return

    // 检查卡牌 tag
    const card = useCardEvent.medium as any
    if (requiredTag && !card?.tags?.includes(requiredTag)) return

    // 修改 info.repeat
    if (useCardEvent.info) {
        if (addRepeat !== undefined) {
            useCardEvent.info.repeat = (useCardEvent.info.repeat || 1) + Number(addRepeat)
        } else if (repeat !== undefined) {
            useCardEvent.info.repeat = Number(repeat)
        }
        newLog([`${card?.label || "卡牌"} 将打出 ${useCardEvent.info.repeat} 次`])
    }

    // 消耗关联状态的层数
    if (consumeStateKey) {
        handleEventEntity(useCardEvent.source, (entity) => {
            if (!isEntity(entity)) return
            const sm = getStateModifier(entity as any)
            sm.changeStack(String(consumeStateKey), "default", -1)
        })
    }
}
