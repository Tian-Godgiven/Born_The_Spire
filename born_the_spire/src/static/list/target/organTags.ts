/**
 * 器官标签系统
 */

import { TagConfig } from "@/core/types/OrganTypes"

/**
 * 常用标签常量
 */
export const OrganTags = {
    CURSED: "cursed",           // 诅咒
    CANCER: "cancer",           // 癌变
    STARTER: "starter",         // 初始器官
    UNIQUE: "unique",           // 唯一器官
    TEMPORARY: "temporary",     // 临时器官
    FRAGILE: "fragile",         // 脆弱（容易损坏）
    INDESTRUCTIBLE: "indestructible", // 不可摧毁
    SYNTHETIC: "synthetic",     // 合成器官
    MUTATED: "mutated"          // 变异器官
} as const

/**
 * 标签配置列表
 */
export const tagConfigList: TagConfig[] = [
    {
        key: OrganTags.CURSED,
        label: "诅咒",
        color: "#8B0000",
        description: "诅咒器官无法正常移除，可能带来强大效果但伴随严重副作用"
    },
    {
        key: OrganTags.CANCER,
        label: "癌变",
        color: "#4B0082",
        description: "癌变器官可能扩散到其他器官，损坏时有特殊惩罚"
    },
    {
        key: OrganTags.STARTER,
        label: "初始",
        color: "#808080",
        description: "初始器官无法移除，是角色的核心组成部分"
    },
    {
        key: OrganTags.UNIQUE,
        label: "唯一",
        color: "#FFD700",
        description: "唯一器官不能同时拥有多个"
    },
    {
        key: OrganTags.TEMPORARY,
        label: "临时",
        color: "#87CEEB",
        description: "临时器官在战斗结束后消失"
    },
    {
        key: OrganTags.FRAGILE,
        label: "脆弱",
        color: "#FFA500",
        description: "脆弱器官更容易损坏"
    },
    {
        key: OrganTags.INDESTRUCTIBLE,
        label: "不朽",
        color: "#00CED1",
        description: "不可摧毁的器官永远不会损坏"
    },
    {
        key: OrganTags.SYNTHETIC,
        label: "合成",
        color: "#9370DB",
        description: "人工合成的器官，可能有特殊机制"
    },
    {
        key: OrganTags.MUTATED,
        label: "变异",
        color: "#32CD32",
        description: "变异器官具有不稳定的效果"
    }
]

/**
 * 根据标签key获取配置
 */
export function getTagConfig(tag: string): TagConfig | undefined {
    return tagConfigList.find(c => c.key === tag)
}

/**
 * 根据标签获取显示名称
 */
export function getTagLabel(tag: string): string {
    return getTagConfig(tag)?.label || tag
}

/**
 * 根据标签获取颜色
 */
export function getTagColor(tag: string): string {
    return getTagConfig(tag)?.color || "#FFFFFF"
}

/**
 * 检查器官是否有指定标签
 */
export function hasTag(tags: string[] | undefined, tag: string): boolean {
    return tags?.includes(tag) ?? false
}

/**
 * 检查器官是否有任意一个指定标签
 */
export function hasAnyTag(tags: string[] | undefined, ...checkTags: string[]): boolean {
    if (!tags) return false
    return checkTags.some(tag => tags.includes(tag))
}

/**
 * 检查器官是否有所有指定标签
 */
export function hasAllTags(tags: string[] | undefined, ...checkTags: string[]): boolean {
    if (!tags) return false
    return checkTags.every(tag => tags.includes(tag))
}
