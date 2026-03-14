/**
 * 器官奖励动作相关的效果函数
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 启用器官奖励动作
 *
 * @params {
 *   actionKey: string  - 要启用的动作 key
 * }
 */
export const enableOrganRewardAction: EffectFunc = async (event, effect) => {
  const { target } = event
  const actionKey = String(effect.params.actionKey)

  if (!actionKey) {
    console.warn("[enableOrganRewardAction] 缺少 actionKey 参数")
    return
  }

  // 验证 target 是 Player
  const player = Array.isArray(target) ? target[0] : target
  if (!(player instanceof Player)) {
    console.warn("[enableOrganRewardAction] target 必须是 Player")
    return
  }

  // 启用动作
  player.enabledOrganRewardActions.add(actionKey)
  newLog([player, `解锁器官奖励动作: ${actionKey}`])
}

/**
 * 禁用器官奖励动作
 *
 * @params {
 *   actionKey: string  - 要禁用的动作 key
 * }
 */
export const disableOrganRewardAction: EffectFunc = async (event, effect) => {
  const { target } = event
  const actionKey = String(effect.params.actionKey)

  if (!actionKey) {
    console.warn("[disableOrganRewardAction] 缺少 actionKey 参数")
    return
  }

  // 验证 target 是 Player
  const player = Array.isArray(target) ? target[0] : target
  if (!(player instanceof Player)) {
    console.warn("[disableOrganRewardAction] target 必须是 Player")
    return
  }

  // 禁用动作
  player.enabledOrganRewardActions.delete(actionKey)
  newLog([player, `失去器官奖励动作: ${actionKey}`])
}
