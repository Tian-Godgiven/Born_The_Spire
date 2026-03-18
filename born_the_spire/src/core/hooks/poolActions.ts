import type { PoolActionHandler } from "@/core/types/poolAction"
import { poolActionRegistry } from "@/static/registry/poolActionRegistry"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 内置水池行动
 * 在应用启动时注册
 */

/**
 * 锻炼行动处理器
 * 消耗物质，增加最大生命值
 */
export const exerciseAction: PoolActionHandler = async (player, _context) => {
  const materialCost = 30  // 消耗物质
  const healthGain = 5     // 增加最大生命

  // 检查物质是否足够
  const reserveModifier = getReserveModifier(player)
  const currentMaterial = reserveModifier.getReserve("material")

  if (currentMaterial < materialCost) {
    newLog([`物质不足！需要 ${materialCost}，当前 ${currentMaterial}`])
    return false
  }

  // 消耗物质
  reserveModifier.spendReserve("material", materialCost)

  // 增加最大生命
  await doEvent({
    key: "gainMaxHealth",
    source: player,
    medium: player,
    target: player,
    effectUnits: [{
      key: "gainMaxHealth",
      params: { value: healthGain }
    }]
  })

  newLog([`消耗 ${materialCost} 物质，最大生命 +${healthGain}`])
  return true
}


/**
 * 初始化时注册扩展行动
 * 注意：内置行动（汲取、升级、染血）在 PoolRoom 中直接实现
 */
export function initPoolActions() {
  // 注册锻炼行动（需要遗物解锁）
  poolActionRegistry.registerAction({
    key: "exercise",
    title: "锻炼",
    icon: "💪",
    description: "消耗 30 物质，增加 5 最大生命",
    priority: 70,
    repeatable: true,  // 可重复执行
    enabled: (player, _context) => {
      // 检查玩家是否启用了锻炼行动
      return player.enabledPoolActions.has("exercise")
    }
  }, exerciseAction)

}
