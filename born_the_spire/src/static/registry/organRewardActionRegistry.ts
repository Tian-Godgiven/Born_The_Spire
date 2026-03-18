import type { Organ } from "@/core/objects/target/Organ"
import type { Player } from "@/core/objects/target/Player"
import type { OrganRewardAction, OrganRewardActionHandler, OrganRewardActionContext, RegisteredOrganRewardAction } from "@/core/types/organRewardAction"

/**
 * 器官奖励动作注册表
 * 支持 Mod 扩展
 */
class OrganRewardActionRegistry {
  private actions = new Map<string, RegisteredOrganRewardAction>()

  /**
   * 注册器官奖励动作
   * 供遗物、Mod 使用
   */
  registerAction(config: OrganRewardAction, handler: OrganRewardActionHandler): void {
    if (this.actions.has(config.key)) {
      console.warn(`[OrganRewardActionRegistry] 动作 ${config.key} 已存在，将被覆盖`)
    }
    this.actions.set(config.key, { ...config, handler })
  }

  /**
   * 获取所有可用动作
   */
  getAvailableActions(organ: Organ | null, player: Player, context: OrganRewardActionContext): OrganRewardAction[] {
    const actions: OrganRewardAction[] = []
    for (const action of this.actions.values()) {
      // 检查动作是否可用
      if (typeof action.enabled === "function") {
        if (organ && !action.enabled(organ, player)) {
          continue
        }
      } else if (!action.enabled) {
        continue
      }

      // 返回时排除 handler，只返回配置部分
      const { handler: _, ...actionConfig } = action
      actions.push(actionConfig)
    }

    // 按优先级排序
    return actions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 执行动作
   */
  async executeAction(
    key: string,
    organ: Organ,
    player: Player,
    context: OrganRewardActionContext
  ): Promise<boolean> {
    const action = this.actions.get(key)
    if (!action) {
      console.error(`[OrganRewardActionRegistry] 动作 ${key} 未找到`)
      return false
    }

    try {
      const result = await action.handler(organ, player, context)
      return result
    } catch (error) {
      console.error(`[OrganRewardActionRegistry] 执行动作 ${key} 失败:`, error)
      return false
    }
  }

  /**
   * 检查动作是否存在
   */
  hasAction(key: string): boolean {
    return this.actions.has(key)
  }

  /**
   * 获取动作处理器
   */
  getHandler(key: string): OrganRewardActionHandler | undefined {
    return this.actions.get(key)?.handler
  }

  /**
   * 获取动作配置（不包含 handler）
   */
  getActionConfig(key: string): OrganRewardAction | undefined {
    const action = this.actions.get(key)
    if (!action) return undefined
    const { handler: _, ...config } = action
    return config
  }

  /**
   * 移除动作
   */
  unregisterAction(key: string): boolean {
    const existed = this.actions.delete(key)
    if (existed) {
    }
    return existed
  }

  /**
   * 获取所有已注册的动作 key
   */
  getAllActionKeys(): string[] {
    return Array.from(this.actions.keys())
  }
}

export const organRewardActionRegistry = new OrganRewardActionRegistry()
