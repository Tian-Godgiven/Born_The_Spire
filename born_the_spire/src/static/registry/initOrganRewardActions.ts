import { initOrganRewardActions } from "@/core/hooks/organRewardActions"

/**
 * 初始化器官奖励动作系统
 * 在应用启动时调用
 */
export function initAllOrganRewardActions() {
  initOrganRewardActions()
  console.log("[OrganRewardActions] 器官奖励动作系统初始化完成")
}
