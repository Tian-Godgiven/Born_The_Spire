/**
 * 地图节点
 * 表示地图上的一个房间节点
 */

import type { RoomType } from "@/core/objects/room/Room"

/**
 * 地图节点接口
 */
export interface MapNode {
  /** 节点唯一标识符 */
  id: string

  /** 所在层级（从0开始，0是第一层） */
  layer: number

  /** 房间类型 */
  roomType: RoomType

  /** 具体房间的key（从房间池中选择） */
  roomKey: string

  /** 水平位置（0.0 到 1.0，用于UI显示） */
  x: number

  /** 连接到的下一层节点ID列表 */
  connections: string[]

  /** 节点状态 */
  state: "locked" | "available" | "current" | "completed"
}

/**
 * 创建地图节点
 */
export function createMapNode(config: {
  id: string
  layer: number
  roomType: RoomType
  roomKey: string
  x: number
}): MapNode {
  return {
    id: config.id,
    layer: config.layer,
    roomType: config.roomType,
    roomKey: config.roomKey,
    x: config.x,
    connections: [],
    state: "locked"
  }
}

/**
 * 序列化地图节点
 */
export function serializeMapNode(node: MapNode): any {
  return {
    id: node.id,
    layer: node.layer,
    roomType: node.roomType,
    roomKey: node.roomKey,
    x: node.x,
    connections: [...node.connections],
    state: node.state
  }
}

/**
 * 反序列化地图节点
 */
export function deserializeMapNode(data: any): MapNode {
  return {
    id: data.id,
    layer: data.layer,
    roomType: data.roomType,
    roomKey: data.roomKey,
    x: data.x,
    connections: data.connections || [],
    state: data.state || "locked"
  }
}
