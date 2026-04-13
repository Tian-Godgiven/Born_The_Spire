import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { Player } from "@/core/objects/target/Player"
import type { Describe } from "@/ui/hooks/express/describe"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isPlayer } from "@/core/utils/typeGuards"
import { randomChoices } from "@/core/hooks/random"
import { bindTemporaryEffectTrigger, type TemporaryEffectConfig } from "@/core/effects/card/addTemporaryEffect"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { isCard } from "@/core/utils/typeGuards"

/**
 * 给抽牌堆中的随机卡牌添加临时效果
 * 支持叠加：同源同key的效果会叠加 stackValue 而不是重复添加
 *
 * @params {
 *   count: number        - 随机选择的卡牌数量（默认1）
 *   effectKey: string    - 临时效果的key
 *   label: string        - 临时效果的名称
 *   describe: Describe   - 临时效果的描述（支持 {key:["stackValue"]} 动态引用）
 *   effect: EffectUnit[] - 临时效果的内容
 *   sourceKey: string    - 临时效果的来源key
 *   stackValue: number   - 每次叠加的值（默认取 effect[0].params.value）
 * }
 */
export const giveTemporaryEffectToRandomCards: EffectFunc = (event, effect) => {
  const params = effect.params || {}
  const count = Number(params.count ?? 1)
  const effectKey = String(params.effectKey || "tempEffect")
  const label = String(params.label || "临时效果")
  const describe = (params.describe as Describe) || []
  const effectUnits = (params.effect as EffectUnit[]) || []
  const sourceKey = String(params.sourceKey || "unknown")
  const stackValue = Number(params.stackValue ?? effectUnits[0]?.params?.value ?? 1)

  if (count <= 0) return

  handleEventEntity(event.target, (target) => {
    if (!isPlayer(target)) return
    giveTemporaryEffectToRandomCardsForPlayer(target, count, {
      effectKey,
      label,
      describe,
      effectUnits,
      sourceKey,
      stackValue
    })
  })
}

/**
 * 给玩家抽牌堆中的随机卡牌添加临时效果
 * 先一次性选出 N 张不重复的卡牌，再统一添加效果
 * 已有同源效果的卡牌会叠加而非重复添加
 */
export function giveTemporaryEffectToRandomCardsForPlayer(
  player: Player,
  count: number,
  config: {
    effectKey: string
    label: string
    describe: Describe
    effectUnits: EffectUnit[]
    sourceKey: string
    stackValue: number
  }
) {
  const cards = player.cardPiles.drawPile
  if (!cards || cards.length === 0) {
    console.warn("[giveTemporaryEffectToRandomCards] 抽牌堆为空")
    return
  }

  // 一次性选出 count 张不重复的卡牌
  const selectedCards = randomChoices(cards, Math.min(count, cards.length), "giveTemporaryEffect")

  for (const card of selectedCards) {
    if (!isCard(card)) continue

    // 初始化临时效果列表
    if (!card._temporaryEffects) {
      card._temporaryEffects = []
    }

    // 检查是否已有同源同key的效果
    const existing = card._temporaryEffects.find(
      ef => ef.key === config.effectKey && ef.sourceKey === config.sourceKey
    )

    if (existing) {
      // 叠加：累加 stackValue 和效果参数
      existing.stackValue = (existing.stackValue || 0) + config.stackValue
      if (existing.effect[0]?.params) {
        existing.effect[0].params.value = existing.stackValue
      }
      console.log(`[giveTemporaryEffectToRandomCards] 叠加卡牌临时效果: ${(card as Card).label}, stackValue: ${existing.stackValue}`)
    } else {
      // 新增效果
      // 深拷贝 effectUnits 避免共享引用
      const clonedEffects = JSON.parse(JSON.stringify(config.effectUnits)) as EffectUnit[]

      const tempEffectConfig: TemporaryEffectConfig = {
        id: crypto.randomUUID(),
        key: config.effectKey,
        label: config.label,
        describe: config.describe,
        triggerWhen: "after",
        triggerHow: "via",
        triggerKey: "useCard",
        effect: clonedEffects,
        sourceKey: config.sourceKey,
        duration: "battle",
        stackValue: config.stackValue
      }
      card._temporaryEffects.push(tempEffectConfig)

      // 绑定触发器
      if (card.owner && isPlayer(card.owner)) {
        const removeTriggers = bindTemporaryEffectTrigger(card, card.owner)
        if (!(card as any)._temporaryEffectCleanups) {
          ;(card as any)._temporaryEffectCleanups = []
        }
        ;(card as any)._temporaryEffectCleanups.push(removeTriggers)
      }

      console.log(`[giveTemporaryEffectToRandomCards] 添加卡牌临时效果: ${(card as Card).label}, stackValue: ${config.stackValue}`)
    }
  }
}
