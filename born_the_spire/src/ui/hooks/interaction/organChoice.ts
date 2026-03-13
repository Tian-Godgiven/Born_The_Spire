import { ref } from 'vue'

/**
 * 器官选择 UI 交互系统
 */

// 器官选择配置
export interface OrganChoiceConfig {
    organKeys: string[]        // 可选器官的 key 列表
    minSelect?: number         // 最少选择数量（默认0）
    maxSelect?: number         // 最多选择数量（默认1）
    cancelable?: boolean       // 是否可取消（默认true）
    title?: string             // 标题
    description?: string       // 描述
    // 新增：动作选择模式
    actionMode?: "selectOnly" | "selectThenAction"  // 默认 selectOnly
    availableActions?: string[]  // 可用动作key列表，空则使用注册表
}

// 器官选择结果
export interface OrganChoiceResult {
    selectedKeys: string[]
    selectedActions?: Map<string, string>  // organKey -> actionKey
}

// 当前的器官选择配置
export const currentOrganChoice = ref<OrganChoiceConfig | null>(null)

// 器官选择的 Promise resolver
let organChoiceResolver: ((result: OrganChoiceResult) => void) | null = null

/**
 * 显示器官选择界面并等待玩家选择
 * @param config 器官选择配置
 * @returns 玩家选择的器官 key 列表和选择的动作
 */
export function showOrganChoice(config: OrganChoiceConfig): Promise<OrganChoiceResult> {
    currentOrganChoice.value = config

    return new Promise<OrganChoiceResult>((resolve) => {
        organChoiceResolver = resolve
    })
}

/**
 * 确认器官选择
 * @param result 选择结果（包含器官key列表和动作）
 */
export function confirmOrganChoice(result: OrganChoiceResult) {
    if (organChoiceResolver) {
        organChoiceResolver(result)
        organChoiceResolver = null
    }
    currentOrganChoice.value = null
}

/**
 * 取消器官选择
 */
export function cancelOrganChoice() {
    if (organChoiceResolver) {
        organChoiceResolver({ selectedKeys: [] })
        organChoiceResolver = null
    }
    currentOrganChoice.value = null
}
