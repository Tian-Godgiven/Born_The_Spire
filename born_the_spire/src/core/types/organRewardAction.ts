import type { Organ } from "@/core/objects/target/Organ"
import type { Player } from "@/core/objects/target/Player"

/**
 * 器官奖励动作类型
 */
export interface OrganRewardAction {
  key: string           // 唯一标识: "assimilate" | "devour" | "sacrifice"
  label: string         // 显示名称: "同化" | "吞噬" | "献祭"
  icon: string          // 图标: "🫀" | "⚗️" | "🔥"
  description: string   // 描述文本
  priority: number      // 排序优先级
  enabled: boolean | ((organ: Organ, player: Player) => boolean)  // 是否可用
}

/**
 * 动作上下文
 */
export interface OrganRewardActionContext {
  source: "battleReward" | "blackStore" | "event"  // 来源
  battleType?: "normal" | "elite" | "boss"         // 战斗类型
}

/**
 * 器官奖励动作处理器
 */
export type OrganRewardActionHandler = (
  organ: Organ,
  player: Player,
  context: OrganRewardActionContext
) => Promise<boolean> | boolean

/**
 * 注册的动作配置
 */
export interface RegisteredOrganRewardAction extends OrganRewardAction {
  handler: OrganRewardActionHandler
}
