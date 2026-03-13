import type { Player } from "@/core/objects/target/Player"

/**
 * 水池行动类型
 */
export interface PoolAction {
  key: string           // 唯一标识: "absorb" | "upgrade" | "bloodMark" | "exercise"
  title: string         // 显示标题: "汲取" | "升级" | "染血" | "锻炼"
  icon: string          // 图标: "💧" | "⬆️" | "🩸" | "💪"
  description: string   // 描述文本
  priority: number      // 排序优先级（越高越靠前）
  enabled: boolean | ((player: Player, context: PoolActionContext) => boolean)  // 是否可用
  repeatable?: boolean  // 是否可重复执行（默认 false）
}

/**
 * 水池行动上下文
 */
export interface PoolActionContext {
  layer: number         // 当前层级
  absorbAmount: number  // 汲取物质数量
}

/**
 * 水池行动处理器
 */
export type PoolActionHandler = (
  player: Player,
  context: PoolActionContext
) => Promise<boolean> | boolean

/**
 * 注册的水池行动配置
 */
export interface RegisteredPoolAction extends PoolAction {
  handler: PoolActionHandler
}
