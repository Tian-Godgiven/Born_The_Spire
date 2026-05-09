/**
 * 触发器调试工具
 *
 * 提供查看和调试实体触发器的功能
 */

import { Entity } from "@/core/objects/system/Entity"
import { Trigger } from "@/core/objects/system/trigger/Trigger"
import type { TriggerUnit } from "../types/object/trigger"
import type { DefaultTrigger } from "@/core/objects/system/trigger/defaultTrigger"
import type { ImportantTrigger } from "@/core/objects/system/trigger/importantTrigger"

/**
 * 触发器信息结构
 */
export interface TriggerDebugInfo {
    when: "before" | "after"
    how: "take" | "make" | "via"
    key: string
    level: number
    id: string
    source?: string  // 来源信息（如果有）
    importantKey?: string
    onlyKey?: string
}

/**
 * 实体触发器调试报告
 */
export interface EntityTriggerReport {
    entityLabel: string
    entityKey?: string
    totalTriggers: number
    defaultTriggers: number
    importantTriggers: number
    triggers: TriggerDebugInfo[]
}

/**
 * 获取实体的所有触发器信息
 */
export function getEntityTriggers(entity: Entity): EntityTriggerReport {
    const trigger = entity.trigger
    const triggers: TriggerDebugInfo[] = []

    // 遍历所有 when/how/key 组合
    const whens: ("before" | "after")[] = ["before", "after"]
    const hows: ("take" | "make" | "via")[] = ["take", "make", "via"]

    for (const when of whens) {
        for (const how of hows) {
            const keys = Object.keys(trigger[how][when])
            for (const key of keys) {
                const units = trigger[how][when][key]
                if (units && units.length > 0) {
                    for (const unit of units) {
                        // 查找来源信息
                        const source = findTriggerSource(trigger, unit.id)
                        const importantInfo = findImportantTriggerInfo(trigger, unit.id)

                        triggers.push({
                            when,
                            how,
                            key,
                            level: unit.level || 0,
                            id: unit.id,
                            source,
                            ...importantInfo
                        })
                    }
                }
            }
        }
    }

    return {
        entityLabel: entity.label,
        entityKey: (entity as any).key,
        totalTriggers: triggers.length,
        defaultTriggers: trigger._defaultTrigger.length,
        importantTriggers: trigger._importantTrigger.length,
        triggers
    }
}

/**
 * 查找触发器的来源信息
 */
function findTriggerSource(trigger: Trigger, id: string): string | undefined {
    const defaultTrigger = trigger._defaultTrigger.find(dt => dt.id === id)
    if (defaultTrigger?.info) {
        return defaultTrigger.info
    }

    const importantTrigger = trigger._importantTrigger.find(it => it.id === id)
    if (importantTrigger?.info) {
        return importantTrigger.info
    }

    return undefined
}

/**
 * 查找关键触发器的附加信息
 */
function findImportantTriggerInfo(trigger: Trigger, id: string): { importantKey?: string, onlyKey?: string } {
    const importantTrigger = trigger._importantTrigger.find(it => it.id === id)
    if (importantTrigger) {
        return {
            importantKey: importantTrigger.importantKey,
            onlyKey: importantTrigger.onlyKey
        }
    }
    return {}
}

/**
 * 触发器过滤条件
 */
export interface TriggerFilter {
    when?: "before" | "after"
    how?: "take" | "make" | "via"
    key?: string
    source?: string
}

/**
 * 过滤触发器列表
 */
function filterTriggers(triggers: TriggerDebugInfo[], filter: TriggerFilter): TriggerDebugInfo[] {
    return triggers.filter(t => {
        if (filter.when && t.when !== filter.when) return false
        if (filter.how && t.how !== filter.how) return false
        if (filter.key && t.key !== filter.key) return false
        if (filter.source && (!t.source || !t.source.includes(filter.source))) return false
        return true
    })
}

/**
 * 格式化触发器报告为可读文本
 *
 * 按 when → how 分组，组内按 level 降序排列
 * 支持过滤条件
 */
export function formatTriggerReport(report: EntityTriggerReport, filter?: TriggerFilter): string[] {
    const lines: string[] = []

    let triggers = report.triggers
    if (filter) {
        triggers = filterTriggers(triggers, filter)
    }

    lines.push(`=== ${report.entityLabel} 的触发器 (${triggers.length}) ===`)
    lines.push('')

    if (triggers.length === 0) {
        lines.push('无匹配的触发器')
        return lines
    }

    // 按 when → how 分组，组内按 level 降序
    const grouped = groupTriggers(triggers)

    for (const [groupKey, groupTriggers] of grouped) {
        const [when, how] = groupKey.split('_')
        lines.push(`── ${when} ─ ${how} ──`)

        for (const t of groupTriggers) {
            const sourceStr = t.source ? ` | 来源: ${t.source}` : ''
            const levelStr = ` | level: ${t.level}`
            lines.push(`[${t.when}][${t.how}] ${t.key}${sourceStr}${levelStr}`)

            // 额外属性换行缩进展示
            if (t.importantKey) {
                lines.push(`        --importantKey: ${t.importantKey}`)
            }
            if (t.onlyKey) {
                lines.push(`        --onlyKey: ${t.onlyKey}`)
            }
        }
        lines.push('')
    }

    return lines
}

/**
 * 按 when → how 分组触发器，组内按 level 降序
 * 返回有序的 [groupKey, triggers][] 数组
 */
function groupTriggers(triggers: TriggerDebugInfo[]): [string, TriggerDebugInfo[]][] {
    const grouped: Record<string, TriggerDebugInfo[]> = {}

    // when 和 how 的固定顺序
    const whenOrder = ["before", "after"]
    const howOrder = ["make", "via", "take"]

    for (const t of triggers) {
        const key = `${t.when}_${t.how}`
        if (!grouped[key]) {
            grouped[key] = []
        }
        grouped[key].push(t)
    }

    // 组内按 level 降序（高优先级在前），同 level 按 key 排序
    for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level
            return a.key.localeCompare(b.key)
        })
    }

    // 按 when → how 固定顺序排列
    const result: [string, TriggerDebugInfo[]][] = []
    for (const when of whenOrder) {
        for (const how of howOrder) {
            const key = `${when}_${how}`
            if (grouped[key]) {
                result.push([key, grouped[key]])
            }
        }
    }

    return result
}

/**
 * 按 ID 移除触发器
 * @returns 是否成功移除
 */
export function removeTriggerById(entity: Entity, id: string): boolean {
    const trigger = entity.trigger

    // 在 _defaultTrigger 中查找
    const defaultIndex = trigger._defaultTrigger.findIndex(dt => dt.id === id)
    if (defaultIndex >= 0) {
        const dt = trigger._defaultTrigger[defaultIndex]
        dt.remove()
        trigger._defaultTrigger.splice(defaultIndex, 1)
        return true
    }

    // 在 _importantTrigger 中查找
    const importantIndex = trigger._importantTrigger.findIndex(it => it.id === id)
    if (importantIndex >= 0) {
        const it = trigger._importantTrigger[importantIndex]
        it.remove()
        trigger._importantTrigger.splice(importantIndex, 1)
        return true
    }

    return false
}

/**
 * 按 importantKey 移除所有匹配的触发器
 * @returns 移除的数量
 */
export function removeTriggersByImportantKey(entity: Entity, importantKey: string): number {
    const trigger = entity.trigger
    const toRemove = trigger._importantTrigger.filter(it => it.importantKey === importantKey)

    for (const it of toRemove) {
        it.remove()
        const index = trigger._importantTrigger.indexOf(it)
        if (index >= 0) {
            trigger._importantTrigger.splice(index, 1)
        }
    }

    return toRemove.length
}

/**
 * 获取触发器的移除函数（用于撤销）
 */
export function getTriggerRemover(entity: Entity, id: string): (() => void) | null {
    const trigger = entity.trigger

    const defaultTrigger = trigger._defaultTrigger.find(dt => dt.id === id)
    if (defaultTrigger) {
        return defaultTrigger.remove
    }

    const importantTrigger = trigger._importantTrigger.find(it => it.id === id)
    if (importantTrigger) {
        return importantTrigger.remove
    }

    return null
}
