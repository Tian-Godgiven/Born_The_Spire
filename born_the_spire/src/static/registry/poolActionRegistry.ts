import type { Player } from "@/core/objects/target/Player"
import type { PoolAction, PoolActionHandler, PoolActionContext, RegisteredPoolAction } from "@/core/types/poolAction"

/**
 * 水池行动注册表
 * 支持 Mod 扩展
 */
class PoolActionRegistry {
  private actions = new Map<string, RegisteredPoolAction>()

  /**
   * 注册水池行动
   * 供遗物、Mod 使用
   */
  registerAction(config: PoolAction, handler: PoolActionHandler): void {
    if (this.actions.has(config.key)) {
      console.warn(`[PoolActionRegistry] 行动 ${config.key} 已存在，将被覆盖`)
    }
    this.actions.set(config.key, { ...config, handler })
  }

  /**
   * 获取所有可用行动
   */
  getAvailableActions(player: Player, context: PoolActionContext): PoolAction[] {
    const actions: PoolAction[] = []
    for (const action of this.actions.values()) {
      // 检查行动是否可用
      if (typeof action.enabled === "function") {
        if (!action.enabled(player, context)) {
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
   * 执行行动
   */
  async executeAction(
    key: string,
    player: Player,
    context: PoolActionContext
  ): Promise<boolean> {
    const action = this.actions.get(key)
    if (!action) {
      console.error(`[PoolActionRegistry] 行动 ${key} 未找到`)
      return false
    }

    try {
      const result = await action.handler(player, context)
      return result
    } catch (error) {
      console.error(`[PoolActionRegistry] 执行行动 ${key} 失败:`, error)
      return false
    }
  }

  /**
   * 检查行动是否存在
   */
  hasAction(key: string): boolean {
    return this.actions.has(key)
  }

  /**
   * 获取行动处理器
   */
  getHandler(key: string): PoolActionHandler | undefined {
    return this.actions.get(key)?.handler
  }

  /**
   * 获取行动配置（不包含 handler）
   */
  getActionConfig(key: string): PoolAction | undefined {
    const action = this.actions.get(key)
    if (!action) return undefined
    const { handler: _, ...config } = action
    return config
  }

  /**
   * 移除行动
   */
  unregisterAction(key: string): boolean {
    const existed = this.actions.delete(key)
    if (existed) {
    }
    return existed
  }

  /**
   * 获取所有已注册的行动 key
   */
  getAllActionKeys(): string[] {
    return Array.from(this.actions.keys())
  }
}

export const poolActionRegistry = new PoolActionRegistry()
