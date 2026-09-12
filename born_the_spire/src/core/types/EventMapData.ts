/**
 * 事件配置类型定义
 */

import type { Component } from "vue"
import type { RoomAvailableCondition } from "@/static/registry/roomRegistry"
import type { Condition } from "./ConditionSystem"
import type { EventRoom } from "@/core/objects/room/EventRoom"

/**
 * 战斗场景奖励配置
 */
export interface BattleRewardConfig {
    gold?: number
    cardPool?: string[]
    cardChoices?: number
    cardPick?: number
    relics?: { rarity: string }[]
    potions?: { rarity: string }[]
}

/**
 * 战斗场景配置
 */
export interface BattleSceneConfig {
    enemies: string[]
    rewards?: BattleRewardConfig
    afterEffects?: Array<{ key: string; params?: any }>
    onWin?: string
    onLose?: string | "gameOver"
}

/**
 * 事件选项配置
 */
export interface EventOptionMap {
    key?: string                    // 选项唯一标识（用于互斥配置）
    title: string                   // 选项标题
    // 选项描述。不写则只显示 title。函数每次渲染读 sceneData（发育选项上的当前代价）。
    description?: string | ((sceneData: any) => string)
    icon?: string                   // 选项图标
    // 有则 EventRoom 在描述后渲染可悬停的【器官名】（OrganRefText + OrganHoverContent）
    previewOrganKey?: string | ((sceneData: any) => string)
    // 器官名后面的尾巴（「失去器官【石芯】，获得金币」）
    previewOrganAfter?: string | ((sceneData: any) => string)
    effects?: Array<{               // 简单效果列表（使用 eventEffectMap）
        key: string                 // 效果 key
        params?: any                // 效果参数
    }>
    // 换幕之后再跑。获得卡牌这种带飞牌的写这里，先进结果幕再发。
    // 不要和战斗幕 BattleSceneConfig.afterEffects（打完再跑）混用。
    afterEffects?: Array<{
        key: string
        params?: any
    }>
    component?: Component | string  // 复杂交互组件（转盘、配对等）
    // 自定义回调。第二个参数就是当前 EventRoom。
    // 结算优先写 effects[]；这里只留「要等人选完才能知道下一步」的口子。
    // 返回字符串时覆盖 option.nextScene。
    customCallback?: (sceneData?: any, room?: EventRoom) => void | string | Promise<void | string>
    rewards?: Array<{ type: string; [key: string]: any }>  // 奖励配置列表（弹出奖励选择弹窗）

    // 是否可用（不满足时选项置灰，仍然显示）。
    // 字符串条件走 Condition 系统；函数则每次渲染读 sceneData（赌桌「庄家未亮点时停下不可点」）
    ifAble?: Condition | ((sceneData: any) => boolean)

    // 是否显示（返回 false 则不显示此选项，多幕事件基于 sceneData）
    ifShow?: (sceneData: any) => boolean
    nextScene?: string              // 选择后跳转到的幕 key
    /** 先把标题/正文/选项渐隐，换幕后再渐显。迷晕、醒来这类换幕用。 */
    fadeToNext?: boolean
    /** 只开地图，不锁交互。关掉地图还能选别的。不写 nextScene 且没有实质效果时默认也是这样。 */
    openMap?: boolean
    saveData?: (sceneData: any) => void | Promise<void>  // 保存数据到 sceneData
}

/**
 * 事件幕配置（多幕事件）
 */
export interface EventSceneMap {
    key: string                     // 幕的唯一标识
    title: string                   // 幕标题
    // 幕描述。静态字符串或函数——函数式描述在渲染时接收 sceneData，用于随剧情累进变化的文本
    description: string | ((sceneData: any) => string)

    // 场景类型："text"（默认）为文本选择，"battle" 为嵌入战斗
    type?: "text" | "battle"

    // 战斗场景配置（type 为 "battle" 时使用）
    battle?: BattleSceneConfig

    /**
     * 幕级整页组件。有则 EventRoom 不再画标题/正文/选项，由组件自己排版。
     * EventRoom.vue 会传入 EventSceneProps（room / event / scene / sceneData / choices）。
     * 点选走 room.selectChoice；非选项交互演完后走 room.apply。
     * 事件顶层 component 仍是插在正文和选项之间的小块，不要和这个混用。
     */
    component?: Component | string

    /** 进入此幕时调用（含从别的幕跳来、以及 nextScene 指回自己）。可在这里 prepare 本把数据。 */
    onEnter?: (sceneData: any) => void | Promise<void>

    options: EventOptionMap[]       // 幕的选项列表
    mutuallyExclusiveGroups?: string[][]  // 互斥组（幕级别）
}

/**
 * 事件配置映射
 */
export interface EventMap {
    key: string                     // 事件唯一标识
    title: string                   // 事件标题
    description: string             // 事件描述
    icon?: string                   // 事件图标

    // 单幕事件（现有方式，保持兼容）
    options?: EventOptionMap[]      // 事件选项列表
    mutuallyExclusiveGroups?: string[][]  // 互斥组：每个数组内的选项key互斥（只能选一个）

    // 多幕事件（新增）
    scenes?: EventSceneMap[]        // 多幕配置（如果提供 scenes，则忽略 options）

    // 事件进入时执行的钩子（多幕事件常用于预 pick / 骰随机结果并写入 sceneData）
    onEnter?: (sceneData: any) => void | Promise<void>

    component?: Component | string  // 自定义事件组件（可选）
    availableCondition?: RoomAvailableCondition  // 出现条件（可选）
}
