import { Entity } from "@/core/objects/system/Entity"
import { ActiveAbility, AbilityMenuConfig } from "@/core/types/ActiveAbility"
import { createApp, App } from 'vue'
import AbilityMenu from '@/ui/components/interaction/AbilityMenu.vue'
import AbilityTargetSelector from '@/ui/components/interaction/AbilityTargetSelector.vue'

/**
 * 能力菜单显示参数
 */
export interface AbilityMenuParams {
    item: Entity
    owner: Entity
    abilities: ActiveAbility[]
    menuConfig: AbilityMenuConfig
    onSelectAbility: (abilityKey: string) => Promise<void>
    onSelectCallback: (callback: Function) => Promise<void>
}

/**
 * 显示能力菜单UI
 */
export async function showAbilityMenuUI(params: AbilityMenuParams): Promise<void> {
    return new Promise((resolve) => {
        // 创建临时容器
        const container = document.createElement('div')
        document.body.appendChild(container)

        // 创建Vue应用实例
        const app = createApp(AbilityMenu, {
            item: params.item,
            owner: params.owner,
            abilities: params.abilities,
            menuConfig: params.menuConfig,
            onSelectAbility: async (abilityKey: string) => {
                await params.onSelectAbility(abilityKey)
                cleanup()
                resolve()
            },
            onSelectCallback: async (callback: Function) => {
                await params.onSelectCallback(callback)
                cleanup()
                resolve()
            },
            onClose: () => {
                cleanup()
                resolve()
            }
        })

        // 挂载组件
        const instance = app.mount(container)

        // 显示菜单
        ;(instance as any).show()

        // 清理函数
        function cleanup() {
            app.unmount()
            document.body.removeChild(container)
        }
    })
}

/**
 * 目标选择参数
 */
export interface TargetSelectionParams {
    targetType: "enemy" | "ally" | "card" | "organ"
    amount: number
    title: string
    filter?: (target: Entity) => boolean
}

/**
 * 选择目标
 */
export async function chooseTarget(params: TargetSelectionParams): Promise<Entity[] | null> {
    return new Promise((resolve) => {
        // 创建临时容器
        const container = document.createElement('div')
        document.body.appendChild(container)

        // 创建Vue应用实例
        const app = createApp(AbilityTargetSelector, {
            targetConfig: {
                type: params.targetType,
                count: { min: params.amount, max: params.amount },
                filter: params.filter
            },
            onConfirm: (targets: Entity[]) => {
                cleanup()
                resolve(targets)
            },
            onCancel: () => {
                cleanup()
                resolve(null)
            }
        })

        // 挂载组件
        const instance = app.mount(container)

        // 显示选择器
        ;(instance as any).show(params.title)

        // 清理函数
        let cleanup = () => {
            app.unmount()
            document.body.removeChild(container)
        }

        // 设置全局点击监听器来选择目标
        const clickHandler = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            const entityElement = target.closest('[data-entity-id]')

            if (entityElement) {
                const entityId = entityElement.getAttribute('data-entity-id')
                // 这里需要根据实际情况获取Entity对象
                // 暂时跳过具体实现
                console.log(`[TargetSelection] 点击了实体: ${entityId}`)
            }
        }

        document.addEventListener('click', clickHandler)

        // 在清理时移除监听器
        const originalCleanup = cleanup
        cleanup = () => {
            document.removeEventListener('click', clickHandler)
            originalCleanup()
        }
    })
}

/**
 * 显示能力详情
 */
export function showAbilityDetail(ability: ActiveAbility, item: Entity, owner: Entity): void {
    console.log(`[AbilityDetail] 显示能力详情: ${ability.label}`)
    // TODO: 实现能力详情弹窗
}

/**
 * 显示能力不可用原因
 */
export function showAbilityUnavailableReason(ability: ActiveAbility, reason: string): void {
    console.log(`[AbilityUnavailable] ${ability.label} 不可用: ${reason}`)
    // TODO: 实现不可用原因提示
}