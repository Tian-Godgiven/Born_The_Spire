import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { randomChoice, randomChoices } from "@/core/hooks/random"
import type { Organ } from "@/core/objects/target/Organ"
import type { Entity } from "@/core/objects/system/Entity"
import type { Chara } from "@/core/objects/target/Target"
import { nowBattle } from "@/core/objects/game/battle"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"
import { isChara } from "@/core/utils/typeGuards"

/**
 * 恢复所有被禁用的器官（战斗结束时调用）
 * 直接恢复 isDisabled = false 并重新激活 work 触发器，不消耗物质
 */
export function cleanupAllDisabledOrgans() {
  const battle = nowBattle.value
  if (!battle) return

  const players = battle.getTeam("player") || []
  const enemies = battle.getAliveEnemies()
  const allEntities = [...players, ...enemies]

  for (const entity of allEntities) {
    const organModifier = getOrganModifier(entity)
    const cardModifier = getCardModifier(entity)
    for (const organ of organModifier.getOrgans()) {
      if (organ.isDisabled) {
        organ.isDisabled = false
        organ.removeBrokenTriggers()
        organ.activateWorkTriggers(entity)

        const organCards = cardModifier.getCardsFromSource(organ)
        for (const card of organCards) {
          card.isDisabled = false
        }
      }
    }
  }
}

/**
 * 禁用指定器官
 * 通过 breakOrgan 设置 organ.isDisabled = true，自动移除 work 触发器
 * 根据 cleanAt 参数决定何时恢复
 *
 * @params {
 *   organ: Organ  - 要禁用的器官对象
 *   cleanAt: "battleEnd" | "turnEnd"  - 清理时机（默认 battleEnd）
 * }
 */
export const disableOrgan: EffectFunc = (event, effect) => {
  const organ = effect.params.organ as Organ
  const cleanAt = effect.params.cleanAt ?? "battleEnd"
  const target = event.target as any

  if (!organ) return

  const organModifier = getOrganModifier(target)
  organModifier.breakOrgan(organ)

  if (cleanAt === "turnEnd") {
    // 把触发器挂在目标身上（敌人或玩家）
    const entity = target
    const { remove } = entity.appendTrigger({
      when: "after",
      how: "make",
      key: "turnEnd",
      callback: () => {
        restoreOrgan(organ, entity)
        remove()
      }
    })
  } else {
    // 战斗结束时恢复
    event.collectSideEffect(() => {
      restoreOrgan(organ, target)
    })
  }
}

/**
 * 恢复单个被禁用的器官
 */
function restoreOrgan(organ: Organ, entity: Chara) {
  if (!organ.isDisabled) return
  const organModifier = getOrganModifier(entity)
  const cardModifier = getCardModifier(entity)

  organ.isDisabled = false
  organ.removeBrokenTriggers()
  organ.activateWorkTriggers(entity)

  const organCards = cardModifier.getCardsFromSource(organ)
  for (const card of organCards) {
    card.isDisabled = false
  }
}

/**
 * 随机禁用目标的若干个器官
 *
 * @params {
 *   count: number  - 随机禁用的器官数量（默认1）
 *   cleanAt: "battleEnd" | "turnEnd"  - 清理时机（默认 battleEnd）
 * }
 */
export const disableRandomOrgans: EffectFunc = (event, effect) => {
  const count = Number(effect.params.count ?? 1)
  const cleanAt = effect.params.cleanAt ?? "battleEnd"
  const target = event.target as any

  const targets = Array.isArray(target) ? target : [target]
  for (const t of targets) {
    const organModifier = getOrganModifier(t)
    const organs = organModifier.getOrgans()
    if (!organs || organs.length === 0) continue

    const selected = count === 1
      ? [randomChoice(organs, "disableOrgan")]
      : randomChoices(organs, count, "disableOrgan")

    for (const organ of selected) {
      organModifier.breakOrgan(organ)

      if (cleanAt === "turnEnd") {
        // 敌人现在有 turnEnd 事件了，直接挂到敌人身上
        const entity = t
        const { remove } = entity.appendTrigger({
          when: "after",
          how: "make",
          key: "turnEnd",
          callback: () => {
            restoreOrgan(organ, entity)
            remove()
          }
        })
      } else {
        event.collectSideEffect(() => {
          restoreOrgan(organ, t)
        })
      }
    }
  }
}

/**
 * 检查器官是否被禁用
 */
export function isOrganDisabled(organ: Organ, _target?: any): boolean {
  return organ.isDisabled
}
