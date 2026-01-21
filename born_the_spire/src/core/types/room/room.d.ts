/**
 * 房间系统类型定义
 */

import { Room, RoomType } from "@/core/objects/room/Room"

/**
 * 房间选择选项
 * 用于在每层选择房间时展示
 */
export interface RoomOption {
    room: Room          // 房间实例
    isRevealed: boolean // 是否显示房间具体内容（受效果影响）
    isHidden: boolean   // 是否隐藏房间类型（受效果影响）
}

/**
 * 房间生成配置
 * 用于配置每层房间的生成规则
 */
export interface RoomGenerationConfig {
    layer: number                      // 层级
    normalBattleWeight: number         // 普通战斗权重
    eliteBattleWeight: number          // 精英战斗权重
    eventWeight: number                // 事件权重
    poolWeight: number                 // 水池权重
    blackStoreWeight: number           // 黑市权重
    forcedRoomType?: RoomType          // 强制房间类型（如Boss前固定水池）
}

/**
 * 房间池配置
 * 用于定义每层房间的数量范围
 */
export interface RoomPoolConfig {
    event: { min: number; max: number }      // 事件房间 3-7个
    pool: { min: number; max: number }       // 水池房间 2-5个
    blackStore: { min: number; max: number } // 黑市房间 1-4个
}
