import type { OrganRewardActionHandler } from "@/core/types/organRewardAction"
import { organRewardActionRegistry } from "@/static/registry/organRewardActionRegistry"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { loadMetaProgress, saveMetaProgress, unlockOrgan } from "@/core/persistence/metaProgress"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 内置器官奖励动作
 * 在应用启动时注册
 */

/**
 * 同化动作处理器
 * 获取器官及其能力
 */
export const assimilateAction: OrganRewardActionHandler = async (organ, player) => {
  const modifier = getOrganModifier(player)
  const result = modifier.assimilateOrgan(organ)

  // 解锁器官
  if (result && organ.key) {
    const metaProgress = loadMetaProgress()
    const unlocked = unlockOrgan(metaProgress, organ.key)
    if (unlocked) {
      saveMetaProgress(metaProgress)
    }
  }

  return result
}

/**
 * 吞噬动作处理器
 * 吞噬器官获得物质
 */
export const devourAction: OrganRewardActionHandler = async (organ, player) => {
  const modifier = getOrganModifier(player)
  return modifier.devourOrgan(organ)
}

/**
 * 献祭动作处理器
 * 献祭器官获得生命值（需要献祭遗物）
 */
export const sacrificeAction: OrganRewardActionHandler = async (organ, player) => {
  // 献祭器官，回复生命值
  const healAmount = 10  // 基础回复量
  await doEvent({
    key: "heal",
    source: player,
    medium: organ,
    target: player,
    effectUnits: [{
      key: "heal",
      params: { value: healAmount }
    }]
  })

  return true
}

/**
 * 初始化时注册内置动作
 */
export function initOrganRewardActions() {
  // 注册同化动作
  organRewardActionRegistry.registerAction({
    key: "assimilate",
    label: "同化",
    icon: "🫀",
    description: "获得该器官及其能力",
    priority: 100,
    enabled: true
  }, assimilateAction)

  // 注册吞噬动作
  organRewardActionRegistry.registerAction({
    key: "devour",
    label: "吞噬",
    icon: "⚗️",
    description: "吞噬器官获得物质",
    priority: 90,
    enabled: true
  }, devourAction)

  // 注册献祭动作（需要献祭遗物才显示）
  organRewardActionRegistry.registerAction({
    key: "sacrifice",
    label: "献祭",
    icon: "🔥",
    description: "献祭器官回复生命值",
    priority: 80,
    enabled: (_organ, player) => {
      // 检查玩家是否启用了献祭动作
      return player.enabledOrganRewardActions.has("sacrifice")
    }
  }, sacrificeAction)

}
