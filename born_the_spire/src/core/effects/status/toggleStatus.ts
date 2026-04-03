import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import type { Entity } from "@/core/objects/system/Entity"

/**
 * 在两个值之间切换状态
 *
 * @params {
 *   statusKey: string   - 状态的key
 *   values: [number, number] | [string, string]  - 要切换的两个值
 * }
 *
 * 示例：在 0 和 1 之间切换
 * {
 *   key: "toggleStatus",
 *   params: {
 *     statusKey: "mode",
 *     values: ["even", "odd"]
 *   }
 * }
 */
export const toggleStatus: EffectFunc = (event, effect) => {
  const params = effect.params || {}
  const statusKey = String(params.statusKey)
  const values = (params.values as (number | string)[]) || []

  if (!statusKey || values.length !== 2) {
    console.error("[toggleStatus] 参数错误：需要 statusKey 和 values(长度为2的数组)")
    return
  }

  handleEventEntity(event.target, (target) => {
    const entity = target as Entity
    const status = entity.status[statusKey]
    if (!status) {
      console.error(`[toggleStatus] 目标没有状态: ${statusKey}`)
      return
    }

    const currentValue = status.value
    const [val1, val2] = values

    // 切换值（支持字符串和数字）
    const newValue = currentValue === val1 ? val2 : val1

    // 直接设置原始基础值（绕过 Number 转换）
    ;(status as any)._originalBaseValue.value = newValue
    status.refresh()

    console.log(`[toggleStatus] ${statusKey}: ${currentValue} -> ${newValue}`)
  })
}
