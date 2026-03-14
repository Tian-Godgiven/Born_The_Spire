/**
 * ModifierManager - 修饰器管理器
 *
 * 统一管理所有 Modifier 实例，提供全局钩子和调试功能
 * 使用 WeakMap 避免内存泄漏
 */

import type { Entity } from "../objects/system/Entity"
import type { ItemModifier } from "../objects/system/modifier/ItemModifier"
import type { StateModifier } from "../objects/system/modifier/StateModifier"
import { toRaw } from "vue"

export interface ModifierStats {
    totalEntities: number
    itemModifiers: number
    stateModifiers: number
    totalUnits: number
}

export interface IModifierManager {
    // 注册/注销
    registerItemModifier(entity: Entity, modifier: ItemModifier): void
    registerStateModifier(entity: Entity, modifier: StateModifier): void
    unregisterItemModifier(entity: Entity): void
    unregisterStateModifier(entity: Entity): void

    // 查询
    getItemModifier(entity: Entity): ItemModifier | undefined
    getStateModifier(entity: Entity): StateModifier | undefined

    // 全局钩子
    onModifierAdded?: (type: string, entity: Entity) => void
    onModifierRemoved?: (type: string, entity: Entity) => void

    // 调试
    getStats(): ModifierStats
}

export class ModifierManager implements IModifierManager {
    private itemModifiers = new WeakMap<Entity, ItemModifier>()
    private stateModifiers = new WeakMap<Entity, StateModifier>()

    // 用于统计的临时存储（仅在调试时使用）
    private entityRefs = new Set<WeakRef<Entity>>()

    // 全局钩子
    onModifierAdded?: (type: string, entity: Entity) => void
    onModifierRemoved?: (type: string, entity: Entity) => void

    registerItemModifier(entity: Entity, modifier: ItemModifier): void {
        const raw = toRaw(entity)
        this.itemModifiers.set(raw, modifier)
        this.entityRefs.add(new WeakRef(raw))
        this.onModifierAdded?.("item", entity)
    }

    registerStateModifier(entity: Entity, modifier: StateModifier): void {
        const raw = toRaw(entity)
        this.stateModifiers.set(raw, modifier)
        this.entityRefs.add(new WeakRef(raw))
        this.onModifierAdded?.("state", entity)
    }

    unregisterItemModifier(entity: Entity): void {
        const raw = toRaw(entity)
        this.itemModifiers.delete(raw)
        this.onModifierRemoved?.("item", entity)
    }

    unregisterStateModifier(entity: Entity): void {
        const raw = toRaw(entity)
        this.stateModifiers.delete(raw)
        this.onModifierRemoved?.("state", entity)
    }

    getItemModifier(entity: Entity): ItemModifier | undefined {
        const raw = toRaw(entity)
        return this.itemModifiers.get(raw)
    }

    getStateModifier(entity: Entity): StateModifier | undefined {
        const raw = toRaw(entity)
        return this.stateModifiers.get(raw)
    }

    getStats(): ModifierStats {
        // 清理已被垃圾回收的引用
        const validRefs = new Set<WeakRef<Entity>>()
        let itemCount = 0
        let stateCount = 0
        let totalUnits = 0

        for (const ref of this.entityRefs) {
            const entity = ref.deref()
            if (entity) {
                validRefs.add(ref)

                const itemMod = this.itemModifiers.get(entity)
                if (itemMod) {
                    itemCount++
                    totalUnits += itemMod.getUnits().length
                }

                const stateMod = this.stateModifiers.get(entity)
                if (stateMod) {
                    stateCount++
                    totalUnits += stateMod.getAllStates().length
                }
            }
        }

        this.entityRefs = validRefs

        return {
            totalEntities: validRefs.size,
            itemModifiers: itemCount,
            stateModifiers: stateCount,
            totalUnits
        }
    }
}

// 全局单例
export const modifierManager = new ModifierManager()
