 /* 
 * 层级注册表系统
 * 管理所有层级配置，支持 mod 制作者注册自定义层级
 */

import type { FloorConfig } from "@/core/types/FloorConfig"

/**
 * 层级注册表类
 */
class FloorRegistry {
    // 层级配置映射表（key -> FloorConfig）
    private floors: Map<string, FloorConfig> = new Map()

    /**
     * 注册层级配置
     * @param config 层级配置
     */
    registerFloor(config: FloorConfig): void {
        if (this.floors.has(config.key)) {
            console.warn(`[FloorRegistry] 层级 "${config.key}" 已存在，将被覆盖`)
        }

        this.floors.set(config.key, config)
    }

    /**
     * 批量注册层级配置
     * @param configs 层级配置数组
     */
    registerFloors(configs: FloorConfig[]): void {
        configs.forEach(config => this.registerFloor(config))
    }

    /**
     * 获取层级配置
     * @param key 层级 key
     */
    getFloor(key: string): FloorConfig | undefined {
        return this.floors.get(key)
    }

    /**
     * 获取所有层级配置
     */
    getAllFloors(): FloorConfig[] {
        return Array.from(this.floors.values())
    }

    /**
     * 获取所有层级配置（按 order 排序）
     */
    getAllFloorsSorted(): FloorConfig[] {
        return this.getAllFloors().sort((a, b) => a.order - b.order)
    }

    /**
     * 检查层级是否存在
     * @param key 层级 key
     */
    hasFloor(key: string): boolean {
        return this.floors.has(key)
    }

    /**
     * 清空注册表（用于测试）
     */
    clear(): void {
        this.floors.clear()
    }
}

// 导出单例
export const floorRegistry = new FloorRegistry()

/**
 * 初始化所有层级
 * 在懒加载完成后调用
 */
export async function initAllFloors(): Promise<void> {

    // 导入层级列表
    const { floorList } = await import('@/static/list/floor/floorList')

    // 注册所有层级
    floorRegistry.registerFloors(floorList)

}
