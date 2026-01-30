/**
 * 印记注册表系统
 * 管理所有印记配置，支持 mod 制作者注册自定义印记
 */

import type { MarkConfig } from "@/core/types/MarkConfig"

/**
 * 印记注册表类
 */
class MarkRegistry {
    // 印记配置映射表（key -> MarkConfig）
    private marks: Map<string, MarkConfig> = new Map()

    /**
     * 注册印记配置
     * @param config 印记配置
     */
    registerMark(config: MarkConfig): void {
        if (this.marks.has(config.key)) {
            console.warn(`[MarkRegistry] 印记 "${config.key}" 已存在，将被覆盖`)
        }

        this.marks.set(config.key, config)
    }

    /**
     * 批量注册印记配置
     * @param configs 印记配置数组
     */
    registerMarks(configs: MarkConfig[]): void {
        configs.forEach(config => this.registerMark(config))
    }

    /**
     * 获取印记配置
     * @param key 印记 key
     */
    getMark(key: string): MarkConfig | undefined {
        return this.marks.get(key)
    }

    /**
     * 获取所有印记配置
     */
    getAllMarks(): MarkConfig[] {
        return Array.from(this.marks.values())
    }

    /**
     * 检查印记是否存在
     * @param key 印记 key
     */
    hasMark(key: string): boolean {
        return this.marks.has(key)
    }

    /**
     * 清空注册表（用于测试）
     */
    clear(): void {
        this.marks.clear()
    }
}

// 导出单例
export const markRegistry = new MarkRegistry()

/**
 * 初始化所有印记
 * 在懒加载完成后调用
 */
export async function initAllMarks(): Promise<void> {

    // 导入印记列表
    const { markList } = await import('@/static/list/mark/markList')

    // 注册所有印记
    markRegistry.registerMarks(markList)

}
