/**
 * 事件配置类型定义
 */

import { Component } from "vue"
import { RoomAvailableCondition } from "@/static/registry/roomRegistry"

/**
 * 事件选项配置
 */
export interface EventOptionMap {
    key?: string                    // 选项唯一标识（用于互斥配置）
    title: string                   // 选项标题
    description: string             // 选项描述
    icon?: string                   // 选项图标
    effects?: Array<{               // 简单效果列表（使用 eventEffectMap）
        key: string                 // 效果 key
        params?: any                // 效果参数
    }>
    component?: Component | string  // 复杂交互组件（转盘、配对等）
    customCallback?: (sceneData?: any) => void | Promise<void>  // 自定义回调（多幕事件可访问 sceneData）

    // 多幕事件专用配置
    condition?: (sceneData: any) => boolean  // 条件显示（返回 false 则不显示此选项）
    nextScene?: string              // 选择后跳转到的幕 key
    saveData?: (sceneData: any) => void | Promise<void>  // 保存数据到 sceneData
}

/**
 * 事件幕配置（多幕事件）
 */
export interface EventSceneMap {
    key: string                     // 幕的唯一标识
    title: string                   // 幕标题
    description: string             // 幕描述
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

    component?: Component | string  // 自定义事件组件（可选）
    availableCondition?: RoomAvailableCondition  // 出现条件（可选）
}
