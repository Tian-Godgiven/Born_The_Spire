import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { Entity } from "@/core/objects/system/Entity"
import type { Player } from "@/core/objects/target/Player"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isPlayer } from "@/core/utils/typeGuards"
import { randomChoice, randomChoices } from "@/core/hooks/random"
import { bindTemporaryEffectTrigger, type TemporaryEffectConfig } from "@/core/effects/card/addTemporaryEffect"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { isCard } from "@/core/utils/typeGuards"

/**
 * 给抽牌堆中的随机卡牌添加临时效果
 *
 * @params {
 *   count: number       - 随机选择的卡牌数量（默认1）
 *   effectKey: string   - 临时效果的key
 *   label: string       - 临时效果的名称
 *   describe: string[]  - 临时效果的描述
 *   effect: EffectUnit[] - 临时效果的内容
 *   sourceKey: string   - 临时效果的来源key
 * }
 */
export const giveTemporaryEffectToRandomCards: EffectFunc = (event, effect) => {
  const params = effect.params || {}
  const count = Number(params.count ?? 1)
  const effectKey = String(params.effectKey || "tempEffect")
  const label = String(params.label || "临时效果")
  const describe = (params.describe as string[]) || []
  const effectUnits = (params.effect as EffectUnit[]) || []
  const sourceKey = String(params.sourceKey || "unknown")

  if (count <= 0) return

  handleEventEntity(event.target, (target) => {
    if (!isPlayer(target)) return
    giveTemporaryEffectToRandomCardsForPlayer(target, count, {
      effectKey,
      label,
      describe,
      effectUnits,
      sourceKey
    })
  })
}

/**
 * 给玩家抽牌堆中的随机卡牌添加临时效果
 */
export function giveTemporaryEffectToRandomCardsForPlayer(
  player: Player,
  count: number,
  config: {
    effectKey: string
    label: string
    describe: string[]
    effectUnits: EffectUnit[]
    sourceKey: string
  }
) {
  const cards = player.cardPiles.drawPile
  if (!cards || cards.length === 0) {
    console.warn("[giveTemporaryEffectToRandomCards] 抽牌堆为空")
    return
  }

  // 随机选择count张卡牌
  const selectedCards = count === 1
    ? [randomChoice(cards, "giveTemporaryEffect")]
    : randomChoices(cards, count, "giveTemporaryEffect")

  // 添加临时效果
  for (const card of selectedCards) {
    if (!isCard(card)) continue

    // 初始化临时效果列表
    if (!card._temporaryEffects) {
      card._temporaryEffects = []
    }

    // 添加新效果
    const tempEffectConfig: TemporaryEffectConfig = {
      id: crypto.randomUUID(),
      key: config.effectKey,
      label: config.label,
      describe: config.describe,
      triggerWhen: "after",
      triggerHow: "via",
      triggerKey: "useCard",
      effect: config.effectUnits,
      sourceKey: config.sourceKey,
      duration: "battle"
    }
    card._temporaryEffects.push(tempEffectConfig)

    // 绑定触发器
    if (card.owner && isPlayer(card.owner)) {
      bindTemporaryEffectTrigger(card, card.owner)
    }

    console.log(`[giveTemporaryEffectToRandomCards] 给卡牌添加临时效果: ${card.label}`)
  }
}
