/**
 * 元进度持久化模块
 *
 * 管理器官解锁、器官精通、精英击败记录等跨局 persistent 数据
 * 使用 LocalStorage 存储，支持导出/导入存档
 */

import { newError } from "@/ui/hooks/global/alert"

// ========== 常量 ==========

/** LocalStorage key */
const META_PROGRESS_KEY = "born_the_spire_meta_progress"

/** 存档格式版本 */
const CURRENT_VERSION = 1

/** 初始器官费用上限 - 基础值 */
export const INITIAL_ORGAN_BUDGET_BASE = 4

/** 初始器官费用上限 - 最大值 */
export const INITIAL_ORGAN_BUDGET_MAX = 7

/** 器官稀有度对应的费用 */
export const ORGAN_RARITY_COST: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    unique: 4
}

// ========== 类型定义 ==========

/**
 * 元进度存档结构 V1
 */
export interface MetaProgressSaveV1 {
    version: 1

    /** 已解锁的器官 key 集合 */
    unlockedOrgans: Record<string, true>

    /**
     * 器官进阶精通记录
     * key: organKey
     * value: 该器官达到过的最高进阶等级
     */
    organAscensionMastery: Record<string, number>

    /** 已击败的精英敌人类型 key 集合 */
    defeatedEliteTypes: Record<string, true>
}

/** 当前使用的存档类型 */
export type MetaProgressSave = MetaProgressSaveV1

// ========== 核心 API ==========

/**
 * 加载元进度存档
 * 如果没有存档或格式不兼容，返回默认空存档
 */
export function loadMetaProgress(): MetaProgressSave {
    try {
        const raw = localStorage.getItem(META_PROGRESS_KEY)
        if (!raw) {
            return createDefaultSave()
        }

        const parsed = JSON.parse(raw) as Partial<MetaProgressSave>

        // 版本检查与迁移（未来需要时实现）
        if (parsed.version !== CURRENT_VERSION) {
            console.warn(`[MetaProgress] 存档版本不匹配: ${parsed.version} vs ${CURRENT_VERSION}，使用默认存档`)
            return createDefaultSave()
        }

        // 补全可能缺失的字段
        return {
            version: CURRENT_VERSION,
            unlockedOrgans: parsed.unlockedOrgans ?? {},
            organAscensionMastery: parsed.organAscensionMastery ?? {},
            defeatedEliteTypes: parsed.defeatedEliteTypes ?? {}
        }
    } catch (e) {
        console.error("[MetaProgress] 加载存档失败:", e)
        newError(["加载存档失败，使用默认存档"])
        return createDefaultSave()
    }
}

/**
 * 保存元进度存档
 */
export function saveMetaProgress(data: MetaProgressSave): void {
    try {
        localStorage.setItem(META_PROGRESS_KEY, JSON.stringify(data))
    } catch (e) {
        console.error("[MetaProgress] 保存存档失败:", e)
        newError(["保存存档失败"])
    }
}

/**
 * 创建默认空存档
 */
export function createDefaultSave(): MetaProgressSave {
    return {
        version: CURRENT_VERSION,
        unlockedOrgans: {
            "original_organ_00001": true,  // 默认解锁心脏器官
            "original_organ_00003": true   // 默认解锁石肤器官
        },
        organAscensionMastery: {},
        defeatedEliteTypes: {}
    }
}

/**
 * 清空所有进度（谨慎使用）
 */
export function clearMetaProgress(): void {
    localStorage.removeItem(META_PROGRESS_KEY)
}

// ========== 便捷操作 API ==========

/**
 * 解锁器官
 * @returns 是否是首次解锁
 */
export function unlockOrgan(data: MetaProgressSave, organKey: string): boolean {
    if (data.unlockedOrgans[organKey]) {
        return false
    }
    data.unlockedOrgans[organKey] = true
    return true
}

/**
 * 标记器官进阶精通
 * 将该器官的精通等级更新为 max(旧值, ascensionLevel)
 * @returns 是否更新了精通等级
 */
export function markOrganAscensionMastery(
    data: MetaProgressSave,
    organKey: string,
    ascensionLevel: number
): boolean {
    const current = data.organAscensionMastery[organKey] ?? 0
    if (ascensionLevel > current) {
        data.organAscensionMastery[organKey] = ascensionLevel
        return true
    }
    return false
}

/**
 * 获取器官的最高精通进阶等级
 */
export function getOrganMasteryLevel(data: MetaProgressSave, organKey: string): number {
    return data.organAscensionMastery[organKey] ?? 0
}

/**
 * 检查器官是否已解锁
 */
export function isOrganUnlocked(data: MetaProgressSave, organKey: string): boolean {
    return !!data.unlockedOrgans[organKey]
}

/**
 * 记录击败精英类型
 * @returns 是否是首次击败该类型（可用于触发+1上限提示）
 */
export function markEliteDefeated(data: MetaProgressSave, eliteKey: string): boolean {
    if (data.defeatedEliteTypes[eliteKey]) {
        return false
    }
    data.defeatedEliteTypes[eliteKey] = true
    return true
}

/**
 * 获取当前初始器官费用上限
 * 计算方式：base + 击败精英种类数，不超过 max
 */
export function getInitialOrganBudget(data: MetaProgressSave): number {
    const eliteCount = Object.keys(data.defeatedEliteTypes).length
    const budget = INITIAL_ORGAN_BUDGET_BASE + eliteCount
    return Math.min(budget, INITIAL_ORGAN_BUDGET_MAX)
}

// ========== 导出/导入存档 ==========

/**
 * 将存档导出为 JSON 字符串
 */
export function exportSaveToJson(data?: MetaProgressSave): string {
    const saveData = data ?? loadMetaProgress()
    return JSON.stringify(saveData, null, 2)
}

/**
 * 从 JSON 字符串导入存档
 * @returns 是否导入成功
 */
export function importSaveFromJson(json: string): boolean {
    try {
        const parsed = JSON.parse(json) as Partial<MetaProgressSave>

        // 基本验证
        if (typeof parsed.version !== "number") {
            throw new Error("无效的存档格式：缺少版本号")
        }

        if (!parsed.unlockedOrgans || typeof parsed.unlockedOrgans !== "object") {
            throw new Error("无效的存档格式：unlockedOrgans")
        }

        if (!parsed.organAscensionMastery || typeof parsed.organAscensionMastery !== "object") {
            throw new Error("无效的存档格式：organAscensionMastery")
        }

        if (!parsed.defeatedEliteTypes || typeof parsed.defeatedEliteTypes !== "object") {
            throw new Error("无效的存档格式：defeatedEliteTypes")
        }

        // 补全字段并保存
        const completeSave: MetaProgressSave = {
            version: CURRENT_VERSION,
            unlockedOrgans: parsed.unlockedOrgans,
            organAscensionMastery: parsed.organAscensionMastery,
            defeatedEliteTypes: parsed.defeatedEliteTypes
        }

        saveMetaProgress(completeSave)
        return true
    } catch (e) {
        console.error("[MetaProgress] 导入存档失败:", e)
        newError([`导入存档失败: ${e instanceof Error ? e.message : "未知错误"}`])
        return false
    }
}

/**
 * 复制存档到剪贴板
 */
export async function copySaveToClipboard(data?: MetaProgressSave): Promise<boolean> {
    try {
        const json = exportSaveToJson(data)
        await navigator.clipboard.writeText(json)
        return true
    } catch (e) {
        console.error("[MetaProgress] 复制到剪贴板失败:", e)
        newError(["复制存档失败，请手动复制"])
        return false
    }
}

/**
 * 从剪贴板导入存档
 */
export async function importSaveFromClipboard(): Promise<boolean> {
    try {
        const json = await navigator.clipboard.readText()
        return importSaveFromJson(json)
    } catch (e) {
        console.error("[MetaProgress] 从剪贴板读取失败:", e)
        newError(["读取剪贴板失败"])
        return false
    }
}
