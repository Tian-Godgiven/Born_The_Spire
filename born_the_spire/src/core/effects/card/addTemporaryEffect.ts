import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Player } from "@/core/objects/target/Player"
import { doEvent, ActionEvent } from "@/core/objects/system/ActionEvent"
import { isCard, isPlayer } from "@/core/utils/typeGuards"
import { nanoid } from "nanoid"
import { nowBattle } from "@/core/objects/game/battle"

/**
 * 临时效果配置
 */
export interface TemporaryEffectConfig {
  id: string
  key: string              // 效果唯一标识
  label: string            // 效果名称（UI显示）
  describe: string[]       // 添加的描述（UI显示）
  triggerWhen: "before" | "after"
  triggerHow: "make" | "via" | "take"
  triggerKey: string       // 触发事件类型（如"useCard"）
  effect: EffectUnit[]     // 触发时执行的效果配置（EffectUnit数组）
  sourceKey: string        // 来源唯一标识（用于叠加规则）
  duration: "battle"       // 持续时间（暂时只支持战斗）
  mutuallyExclusive?: string  // 互斥组标识（同组效果只能存在一个，自动替换）
}

/**
 * 为卡牌添加临时效果
 *
 * 这个效果函数会在卡牌上记录一个临时效果配置，并在卡牌打出时触发额外效果。
 * 支持以下叠加规则：
 * - 同一来源的相同效果：替换（新效果覆盖旧效果）
 * - 不同来源的同类效果：叠加（可同时存在）
 * - 互斥效果：自动替换（指定互斥组）
 *
 * @params {
 *   card: Card              - 目标卡牌（默认为 event.target）
 *   effectKey: string       - 效果唯一标识（用于识别和叠加控制）
 *   label: string           - 效果名称（UI显示）
 *   describe: any[]         - 添加的描述（会拼接到卡牌原有描述后）
 *   triggerWhen: "before"|"after"     - 触发时机
 *   triggerHow: "make"|"via"|"take"   - 触发角色
 *   triggerKey: string      - 触发事件类型（如"useCard"）
 *   effect: EffectUnit[]    - 触发时执行的效果
 *   sourceKey: string       - 来源唯一标识（用于判断是否替换）
 *   duration: "battle"      - 持续时间（默认"battle"）
 *   mutuallyExclusive?: string  - 互斥组标识（同组效果只能存在一个，自动替换）
 * }
 */
export const addTemporaryEffect: EffectFunc = (event, effectObj) => {
  const params = effectObj.params || {}
  const card = (params.card as Card | undefined) || (event.target as Card)
  const effectKey = String(params.effectKey || "")
  const label = String(params.label || "临时效果")
  const describe = (params.describe as string[]) || []
  const triggerWhen = (params.triggerWhen as "before" | "after") || "after"
  const triggerHow = (params.triggerHow as "make" | "via" | "take") || "via"
  const triggerKey = String(params.triggerKey || "useCard")
  const effect = (params.effect as EffectUnit[]) || []
  const sourceKey = String(params.sourceKey || "unknown")
  const duration = (params.duration as "battle") || "battle"
  const mutuallyExclusive = params.mutuallyExclusive as string | undefined

  if (!isCard(card)) {
    console.error("[addTemporaryEffect] 目标不是卡牌:", card)
    return
  }

  // 初始化临时效果列表
  if (!card._temporaryEffects) {
    card._temporaryEffects = []
  }

  // 处理互斥效果：先移除同组的其他效果
  if (mutuallyExclusive) {
    card._temporaryEffects = card._temporaryEffects.filter(
      (ef) => ef.mutuallyExclusive !== mutuallyExclusive
    )
  }

  // 检查是否已有相同来源的相同效果（同源替换）
  const existingIndex = card._temporaryEffects.findIndex(
    (ef) => ef.sourceKey === sourceKey && ef.key === effectKey
  )

  if (existingIndex >= 0) {
    // 替换 existing 效果
    card._temporaryEffects[existingIndex] = {
      id: nanoid(),
      key: effectKey,
      label,
      describe,
      triggerWhen,
      triggerHow,
      triggerKey,
      effect,
      sourceKey,
      duration,
      mutuallyExclusive,
    }
    console.log(`[addTemporaryEffect] 替换卡牌临时效果: ${card.label} -> ${effectKey}`)
  } else {
    // 添加新效果
    card._temporaryEffects.push({
      id: nanoid(),
      key: effectKey,
      label,
      describe,
      triggerWhen,
      triggerHow,
      triggerKey,
      effect,
      sourceKey,
      duration,
      mutuallyExclusive,
    })
    console.log(`[addTemporaryEffect] 添加卡牌临时效果: ${card.label} -> ${effectKey}`)
  }

  // 绑定临时效果触发器
  if (isPlayer(event.source)) {
    bindTemporaryEffectTrigger(card, event.source)
  }

  // 注册战斗结束时清理的副作用
  event.collectSideEffect(() => {
    clearTemporaryEffects(card, "battle")
  })
}

/**
 * 为卡牌绑定临时效果的触发器
 */
export function bindTemporaryEffectTrigger(card: Card, owner: Player) {
  if (!card._temporaryEffects || card._temporaryEffects.length === 0) {
    return
  }

  // 只在当前战斗中绑定
  if (!nowBattle.value) {
    console.warn(`[bindTemporaryEffectTrigger] 没有进行中的战斗，无法绑定卡牌临时效果: ${card.label}`)
    return
  }

  // 使用 owner 的 trigger 附加功能
  const removeFunctions: (() => void)[] = []

  for (const tempEffect of card._temporaryEffects) {
    // 创建触发器：当卡牌被打出时，触发临时效果
    const { remove } = owner.trigger.appendTrigger({
      when: tempEffect.triggerWhen,
      how: tempEffect.triggerHow,
      key: tempEffect.triggerKey,
      callback: async (triggerEvent, triggerEffect, _triggerLevel) => {
        // 检查触发事件的 target 是否是这张卡牌
        const targets = Array.isArray(triggerEvent.target) ? triggerEvent.target : [triggerEvent.target]
        if (!targets.includes(card)) return

        // 执行临时效果
        await doEvent({
          key: `temporaryEffect_${tempEffect.key}`,
          source: owner,
          medium: card,
          target: owner,
          effectUnits: tempEffect.effect,
        })
      },
    })

    removeFunctions.push(remove)
  }

  // 注册清理函数：战斗结束时移除触发器
  // 这里需要 getColor 所在的 effect 来注册 sideEffect
  // 由于 bindTemporaryEffectTrigger 在 addTemporaryEffect 中被调用，
  // 实际的 sideEffect 注册应在 addTemporaryEffect 中进行
}

/**
 * 清除卡牌的临时效果
 * @param card 卡牌对象
 * @param duration 指定清除的持续时间类型（如"battle"），不传则清除所有
 */
export function clearTemporaryEffects(card: Card, duration?: "battle") {
  if (!card._temporaryEffects) return

  if (duration) {
    // 只清除指定持续时间的效果
    card._temporaryEffects = card._temporaryEffects.filter(
      (ef) => ef.duration !== duration
    )
  } else {
    // 清除所有临时效果
    card._temporaryEffects = []
  }

  console.log(`[clearTemporaryEffects] 清除卡牌临时效果: ${card.label}`)
}

/**
 * 获取卡牌的临时效果描述
 * @param card 卡牌对象
 * @returns 临时效果描述数组
 */
export function getTemporaryEffectDescribe(card: Card): string[] {
  if (!card._temporaryEffects || card._temporaryEffects.length === 0) {
    return []
  }

  // 累加所有临时效果的描述
  const describes: string[] = []
  for (const tempEffect of card._temporaryEffects) {
    describes.push(...tempEffect.describe)
  }

  return describes
}
