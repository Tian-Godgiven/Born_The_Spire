import { Entity } from "../Entity"
import { Card } from "../../item/Subclass/Card"
import { Organ } from "../../target/Organ"
import { entryList } from "@/static/list/system/entryMap"

/**
 * 词条实例
 * 记录已应用的词条及其触发器移除函数
 */
type EntryInstance = {
    key: string
    removers: Array<() => void>  // 触发器移除函数数组
}

/**
 * 词条修饰器管理器
 *
 * 管理实体（Card/Organ）上的词条及其产生的副作用（触发器等）
 * 使用 WeakMap 存储，避免污染 Entity 基类
 */
export class EntryModifier {
    private readonly owner: Entity  // 持有词条的实体（Card/Organ）
    private entries: Map<string, EntryInstance> = new Map()

    constructor(owner: Entity) {
        this.owner = owner
    }

    /**
     * 添加词条
     * @param entryKey 词条 key
     * @returns true 表示成功，string 表示失败原因
     */
    addEntry(entryKey: string): boolean | string {
        // 检查词条是否已存在
        if (this.entries.has(entryKey)) {
            return `词条 ${entryKey} 已存在`
        }

        // 获取词条定义
        const entryDef = entryList[entryKey]
        if (!entryDef) {
            return `词条 ${entryKey} 不存在`
        }

        // 检查冲突
        if (entryDef.conflictsWith) {
            for (const conflictKey of entryDef.conflictsWith) {
                if (this.entries.has(conflictKey)) {
                    return `词条 ${entryKey} 与已有词条 ${conflictKey} 冲突`
                }
            }
        }

        // 解析父级持有者
        const parentOwner = this.resolveParentOwner()

        // 应用词条
        const removers = entryDef.onApply(this.owner, parentOwner)

        // 记录词条实例
        this.entries.set(entryKey, {
            key: entryKey,
            removers
        })

        return true
    }

    /**
     * 移除词条
     * @param entryKey 词条 key
     * @returns 是否成功移除
     */
    removeEntry(entryKey: string): boolean {
        const instance = this.entries.get(entryKey)
        if (!instance) {
            return false
        }

        // 调用所有移除函数
        for (const remover of instance.removers) {
            remover()
        }

        // 从记录中删除
        this.entries.delete(entryKey)
        return true
    }

    /**
     * 检查是否有某个词条
     */
    hasEntry(entryKey: string): boolean {
        return this.entries.has(entryKey)
    }

    /**
     * 获取所有词条 key
     */
    getEntries(): string[] {
        return Array.from(this.entries.keys())
    }

    /**
     * 解析父级持有者
     * Card.owner → Player/Enemy
     * Organ.owner → Player/Enemy
     */
    private resolveParentOwner(): Entity | undefined {
        if (this.owner instanceof Card) {
            return this.owner.owner
        }
        if (this.owner instanceof Organ) {
            return this.owner.owner
        }
        return undefined
    }
}

// 使用 WeakMap 存储 EntryModifier 实例
const entryModifierMap = new WeakMap<Entity, EntryModifier>()

/**
 * 为实体初始化词条管理器
 */
export function initEntryModifier(entity: Entity): EntryModifier {
    const modifier = new EntryModifier(entity)
    entryModifierMap.set(entity, modifier)
    return modifier
}

/**
 * 获取实体的词条管理器
 */
export function getEntryModifier(entity: Entity): EntryModifier {
    let modifier = entryModifierMap.get(entity)
    if (!modifier) {
        modifier = initEntryModifier(entity)
    }
    return modifier
}
