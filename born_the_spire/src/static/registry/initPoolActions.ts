import { initPoolActions } from "@/core/hooks/poolActions"

/**
 * 初始化水池行动系统
 * 在应用启动时调用
 */
export function initAllPoolActions() {
  initPoolActions()
  console.log("[PoolActions] 水池行动系统初始化完成")
}
