/**
 * 水池行动相关的效果函数
 */

import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { Player } from "@/core/objects/target/Player"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 启用水池行动
 *
 * @params {
 *   actionKey: string  - 要启用的行动 key
 * }
 */
export const enablePoolAction: EffectFunc = async (event, effect) => {
  const { target } = event
  const actionKey = String(effect.params.actionKey)

  if (!actionKey) {
    console.warn("[enablePoolAction] 缺少 actionKey 参数")
    return
  }

  // 验证 target 是 Player
  const player = Array.isArray(target) ? target[0] : target
  if (!(player instanceof Player)) {
    console.warn("[enablePoolAction] target 必须是 Player")
    return
  }

  // 启用行动
  player.enabledPoolActions.add(actionKey)
  newLog([player, `解锁水池行动: ${actionKey}`])
}

/**
 * 禁用水池行动
 *
 * @params {
 *   actionKey: string  - 要禁用的行动 key
 * }
 */
export const disablePoolAction: EffectFunc = async (event, effect) => {
  const { target } = event
  const actionKey = String(effect.params.actionKey)

  if (!actionKey) {
    console.warn("[disablePoolAction] 缺少 actionKey 参数")
    return
  }

  // 验证 target 是 Player
  const player = Array.isArray(target) ? target[0] : target
  if (!(player instanceof Player)) {
    console.warn("[disablePoolAction] target 必须是 Player")
    return
  }

  // 禁用行动
  player.enabledPoolActions.delete(actionKey)
  newLog([player, `失去水池行动: ${actionKey}`])
}
