import type { Describe } from "@/ui/hooks/express/describe"
import type { Entity } from "@/core/objects/system/Entity"
import { cardEntryDefinitions } from "./entry/CardEntry"
import { organEntryDefinitions } from "./entry/OrganEntry"

/**
 * 词条定义（包含实现逻辑）
 *
 * Entry 系统用于为卡牌和器官添加特殊效果词条
 * 词条通过 EntryModifier 应用到实体上，会创建触发器等副作用
 *
 * 触发器挂载位置选择：
 * - 挂载到 owner（器官/卡牌本身）：
 *   当需要监听器官/卡牌自身的事件时使用
 *   例如：器官受到伤害、卡牌被使用等
 *   调用 owner.appendTrigger()
 *
 * - 挂载到 ownersOwner（owner 的 owner，即玩家/敌人）：
 *   当需要监听持有者的事件时使用
 *   例如：玩家受到伤害、回合开始、战斗结束等
 *   调用 ownersOwner.appendTrigger()
 *
 * Mod 制作者可以在 onApply 函数中自由选择触发器的挂载位置
 */
export type EntryDefinition = {
    label: string        // 词条显示名称
    describe: Describe
    conflictsWith?: string[]  // 冲突的词条
    onApply: (owner: Entity, ownersOwner?: Entity) => Array<() => void>  // 返回移除函数数组
}

/**
 * 词条定义注册表
 * 整合所有类型的词条定义
 */
export const entryDefinitions: Record<string, EntryDefinition> = {
    // 卡牌词条（使用 card_ 前缀）
    ...cardEntryDefinitions,

    // 器官词条（使用 organ_ 前缀）
    ...organEntryDefinitions
}