import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEnemy, isOrgan } from "@/core/utils/typeGuards"
import { randomChoice, randomChoices } from "@/core/hooks/random"
import { nowBattle } from "@/core/objects/game/battle"
import type { Organ } from "@/core/objects/target/Organ"
import type { Entity } from "@/core/objects/system/Entity"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 随机禁用目标的若干个器官
 * 可以作用于 Enemy 或 Organ（任何有器官列表的目标）
 *
 * @params {
 *   count: number  - 随机禁用的器官数量（默认1）
 * }
 */
export const disableRandomOrgans: EffectFunc = (event, effect) => {
  const count = Number(effect.params.count ?? 1)
  const source = event.source as Entity

  console.log('[Wheel of Fate Debug] disableRandomOrgans触发')
  console.log('[Wheel of Fate Debug] source:', source?.label, source?.key)
  console.log('[Wheel of Fate Debug] count:', count)
  console.log('[Wheel of Fate Debug] target:', event.target)
  console.log('[Wheel of Fate Debug] target类型:', Array.isArray(event.target) ? 'Array' : typeof event.target)

  if (count <= 0) {
    console.log('[Wheel of Fate Debug] count <= 0，跳过禁用')
    return
  }

  // event.target 可能是 Entity | Entity[]，但类型系统认为是 EventParticipant
  // 直接使用 any 绕过类型检查，因为 disableRandomOrgansForTarget 已经用 any 处理了
  // event.source 也需要断言为 any，因为 disableRandomOrgansForTarget 的 source 参数类型是 Entity
  const target = event.target as any

  if (Array.isArray(target)) {
    console.log('[Wheel of Fate Debug] 目标是数组，逐个处理')
    target.forEach((t: any) => {
      console.log('[Wheel of Fate Debug] 处理目标:', t?.label, '器官数:', t?.organs?.value?.length)
      disableRandomOrgansForTarget(t, count, source)
    })
  } else {
    console.log('[Wheel of Fate Debug] 处理单个目标:', target?.label, '器官数:', target?.organs?.value?.length)
    disableRandomOrgansForTarget(target, count, source)
  }

  event.collectSideEffect(() => {
    cleanupAllDisabledOrgans()
  })
}

/**
 * 禁用单个目标的随机器官
 * target 用 any 类型，因为可能是 Enemy、Organ 或其他有 organs 属性的 Entity
 */
export function disableRandomOrgansForTarget(target: any, count: number, source: Entity): void {
  console.log('[Wheel of Fate Debug] disableRandomOrgansForTarget调用')
  console.log('[Wheel of Fate Debug] target:', target?.label, target?.key)

  // 检查是否有器官修饰器
  if (!(target as any).organs) {
    console.log('[Wheel of Fate Debug] 目标没有organs属性，跳过')
    return
  }

  // 获取器官列表（通过器官修饰器）
  const organs = (target as any).organs.value as Organ[] | undefined
  console.log('[Wheel of Fate Debug] 获取到的器官列表:', organs?.map(o => ({ label: o.label, key: o.key })))

  if (!organs || organs.length === 0) {
    console.log('[Wheel of Fate Debug] 器官列表为空，跳过')
    return
  }

  // 随机选择count个器官
  const selectedOrgans = count === 1
    ? [randomChoice(organs, "disableOrgan")]
    : randomChoices(organs, count, "disableOrgan")

  console.log('[Wheel of Fate Debug] 选择禁用的器官:', selectedOrgans?.map(o => ({ label: o.label, key: o.key })))

  // 初始化禁用器官Map
  if (!(target as any).disabledOrgans) {
    console.log('[Wheel of Fate Debug] 初始化disabledOrgans Map')
    (target as any).disabledOrgans = new Map<string, { source: Entity; disabledAtTurn: number }>()
  }

  // 标记器官被禁用
  for (const organ of selectedOrgans) {
    console.log('[Wheel of Fate Debug] 禁用器官:', organ.label, 'key:', organ.key)
    (target as any).disabledOrgans.set(organ.key, {
      source: source as Entity,
      disabledAtTurn: nowBattle.value?.turnNumber || 1
    })
  }

  console.log('[Wheel of Fate Debug] 最终disabledOrgans Map:', Array.from((target as any).disabledOrgans?.entries() || []))
}

/**
 * 清理所有目标的禁用器官状态（战斗结束时）
 */
export function cleanupAllDisabledOrgans() {
  const battle = nowBattle.value
  if (!battle) return

  // 清理所有存活的敌人
  const enemies = battle.getAliveEnemies()
  for (const enemy of enemies) {
    if ((enemy as any).disabledOrgans) {
      (enemy as any).disabledOrgans.clear()
    }
  }
}

/**
 * 检查器官是否被禁用
 * target 参数改为 any 以兼容 Enemy 和其他类型
 */
export function isOrganDisabled(organ: Organ, target: any): boolean {
    const result = target && 'disabledOrgans' in target && (target as any).disabledOrgans && (target as any).disabledOrgans.has(organ.key)
    if (result) {
        console.log('[Wheel of Fate Debug] 器官被禁用:', organ.label, 'key:', organ.key, '目标:', target?.label)
    }
    return result
}
