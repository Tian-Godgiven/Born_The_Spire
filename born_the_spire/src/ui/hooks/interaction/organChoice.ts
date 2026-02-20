import { ref } from 'vue'
import { OrganMap } from '@/core/objects/target/Organ'

/**
 * 器官选择 UI 交互系统
 */

// 器官选择配置
export interface OrganChoiceConfig {
    organOptions: OrganMap[]  // 可选器官列表
    selectCount: number        // 需要选择的数量
    title?: string             // 标题
    description?: string       // 描述
}

// 当前的器官选择配置
export const currentOrganChoice = ref<OrganChoiceConfig | null>(null)

// 器官选择的 Promise resolver
let organChoiceResolver: ((selectedKeys: string[]) => void) | null = null

/**
 * 显示器官选择界面并等待玩家选择
 * @param config 器官选择配置
 * @returns 玩家选择的器官 key 列表
 */
export function showOrganChoice(config: OrganChoiceConfig): Promise<string[]> {
    currentOrganChoice.value = config

    return new Promise<string[]>((resolve) => {
        organChoiceResolver = resolve
    })
}

/**
 * 确认器官选择
 * @param selectedKeys 选择的器官 key 列表
 */
export function confirmOrganChoice(selectedKeys: string[]) {
    if (organChoiceResolver) {
        organChoiceResolver(selectedKeys)
        organChoiceResolver = null
    }
    currentOrganChoice.value = null
}

/**
 * 取消器官选择
 */
export function cancelOrganChoice() {
    if (organChoiceResolver) {
        organChoiceResolver([])
        organChoiceResolver = null
    }
    currentOrganChoice.value = null
}
