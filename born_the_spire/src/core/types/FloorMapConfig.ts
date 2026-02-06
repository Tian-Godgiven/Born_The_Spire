/**
 * 地图配置类型定义
 */

import type { RoomType } from "@/core/objects/room/Room"

/**
 * 房间池配置
 */
export interface RoomPools {
  battles: string[]
  eliteBattles?: string[]
  events: string[]
  pools: string[]
  blackStores: string[]
}

/**
 * 节点位置配置
 */
export interface NodePositionConfig {
  /** 每层高度（用于Y坐标计算） */
  layerHeight?: number
  /** 水平随机偏移范围 */
  horizontalOffset?: { min: number, max: number }
  /** 垂直随机偏移范围 */
  verticalOffset?: { min: number, max: number }
}

/**
 * 验证策略配置
 */
export interface ValidationStrategy {
  /**
   * 最大重试次数
   * - 0: 不重试，直接使用第一次生成的结果
   * - 1-10: 重试指定次数
   * - 默认: 3
   */
  maxRetries?: number

  /**
   * 重试失败后是否修正地图
   * - true: 修正地图使其满足约束（默认）
   * - false: 不修正，使用最后一次生成的结果
   */
  fixOnFailure?: boolean

  /**
   * 修正后是否再次验证
   * - true: 修正后再次验证，输出警告（默认）
   * - false: 修正后不验证
   */
  revalidateAfterFix?: boolean

  /**
   * 验证失败时是否抛出错误
   * - true: 抛出错误，阻止游戏继续
   * - false: 只输出警告，继续游戏（默认）
   */
  throwOnFailure?: boolean

  /**
   * 自定义修正函数（高级用法）
   * 如果提供，将使用此函数代替默认修正逻辑
   *
   * 注意：此函数只负责修正，验证和重试逻辑仍由系统控制
   *
   * @param map 需要修正的地图
   * @param violations 违规列表
   * @param config 地图配置
   */
  customFix?: (map: any, violations: any[], config: FloorMapConfig) => void

  /**
   * 完全自定义的验证和处理策略（最高级用法）
   * 如果提供，将完全接管验证流程，忽略所有其他配置
   *
   * 使用场景：
   * - 需要完全自定义的验证逻辑
   * - 需要特殊的重试策略
   * - 需要在验证过程中做额外的处理
   *
   * @param map 生成的地图
   * @param config 地图配置
   * @param generateFn 地图生成函数（可用于重新生成）
   * @returns 处理后的地图（可以是原地图或新地图）
   */
  customStrategy?: (
    map: any,
    config: FloorMapConfig,
    generateFn: () => any
  ) => any
}

/**
 * 默认验证策略
 */
export const defaultValidationStrategy: ValidationStrategy = {
  maxRetries: 3,
  fixOnFailure: true,
  revalidateAfterFix: true,
  throwOnFailure: false
}

/**
 * 房间类型权重配置
 */
export interface RoomTypeWeights {
  battle: number
  eliteBattle?: number
  event: number
  pool: number
  blackStore: number
}

/**
 * 地图生成配置
 */
export interface FloorMapConfig {
  // ==================== 基础结构 ====================

  /** 总层数 */
  layers: number

  /** 每层节点数范围（简单配置） */
  nodesPerLayer: {
    min: number
    max: number
  }

  /** 节点数量规则（高级配置，覆盖 nodesPerLayer） */
  nodeCountRules?: {
    /** 起点层节点数 */
    startLayer?: number
    /** 中间层是否使用动态范围（基于起点层：2 到 startLayer*2-1） */
    useDynamicMiddleRange?: boolean
    /** Boss层节点数（默认1） */
    bossLayer?: number
  }

  /** 连接密度（每个节点连接到下一层的节点数） */
  connectionDensity: {
    min: number
    max: number
  }

  // ==================== 房间分配 ====================

  /** 房间类型权重（默认配置，用于概率分配） */
  roomTypeWeights: RoomTypeWeights

  /** 层级特定的权重配置（覆盖默认权重） */
  layerSpecificWeights?: {
    [layer: number]: RoomTypeWeights
  }

  /** 层级布局配置（最高优先级，完全控制某一层的结构） */
  layerLayouts?: {
    [layer: number]: LayerLayout
  }

  /** 房间分配策略 */
  roomAssignmentStrategy?: RoomAssignmentStrategy

  // ==================== 约束规则 ====================

  /** 约束配置 */
  constraints?: {
    /** 全局约束（数量、间隔） */
    global?: RoomTypeConstraints
    /** 放置规则（父母、兄弟） */
    placement?: RoomPlacementRules
  }

  // ==================== 其他配置 ====================

  /** 验证策略配置 */
  validationStrategy?: ValidationStrategy

  /** 节点位置配置（用于UI显示） */
  nodePositionConfig?: NodePositionConfig

  /** 房间池（具体房间key） */
  roomPools: RoomPools

  /** 随机种子（可选，用于可重现的地图生成） */
  seed?: string
}

/**
 * 层级布局配置
 * 用于完全控制某一层的房间结构
 */
export interface LayerLayout {
  /**
   * 模式1：指定具体房间key列表
   * 例如：["battle_normal_slime", "battle_normal_cultist"]
   * 该层将精确生成这些房间
   */
  roomKeys?: string[]

  /**
   * 模式2：指定房间类型列表
   * 例如：["battle", "event", "pool"]
   * 该层将生成这些类型的房间，具体房间从房间池随机选择
   */
  roomTypes?: RoomType[]

  /**
   * 模式3：混合模式（节点配置列表）
   * 例如：[
   *   { roomKey: "battle_boss_slime" },  // 固定房间
   *   { roomType: "event" },             // 随机事件
   *   { roomType: "battle" }             // 随机战斗
   * ]
   */
  nodes?: LayerNodeConfig[]

  /**
   * 节点数量（可选）
   * 如果不指定，使用 roomKeys/roomTypes/nodes 的长度
   * 如果指定且大于列表长度，剩余节点将按默认规则生成
   */
  nodeCount?: number
}

/**
 * 层级节点配置
 */
export interface LayerNodeConfig {
  /** 房间类型（如果不指定 roomKey，则从该类型的房间池随机选择） */
  roomType?: RoomType

  /** 具体房间key（优先级高于 roomType） */
  roomKey?: string
}

/**
 * 房间类型约束（全局约束）
 */
export interface RoomTypeConstraints {
  /** 某类房间在整个地图中的最大数量 */
  maxCount?: {
    [roomType: string]: number
  }

  /** 某类房间在整个地图中的最小数量 */
  minCount?: {
    [roomType: string]: number
  }

  /** 某类房间之间的最小间隔层数 */
  minSpacing?: {
    [roomType: string]: number
  }
}

/**
 * 房间放置规则
 */
export interface RoomPlacementRules {
  /** 父母房间规则（路径上的连续性） */
  parent?: {
    /** 不能跟在自己后面的类型（例如：精英、休息、商店） */
    noSelfFollow?: RoomType[]

    /** 细致的父母规则配置 */
    rules?: {
      [roomType: string]: {
        /** 不能跟在自己后面 */
        cannotFollowSelf?: boolean
        /** 不能跟在这些类型后面 */
        cannotFollow?: RoomType[]
        /** 必须跟在这些类型之一后面 */
        mustFollowOneOf?: RoomType[]
      }
    }
  }

  /** 兄弟房间规则（同层的多样性） */
  sibling?: {
    /** 同层最多几个相同类型 */
    maxSameTypeInLayer?: {
      [roomType: string]: number
    }

    /** 同层必须唯一的类型（等同于 maxSameTypeInLayer = 1） */
    uniqueInLayer?: RoomType[]

    /** 同层必须有多样性（不能全是同一类型） */
    requireDiversity?: boolean

    /** 不能与某些类型共存于同一层 */
    cannotCoexist?: {
      [roomType: string]: RoomType[]
    }
  }
}

/**
 * 房间分配策略
 */
export interface RoomAssignmentStrategy {
  /**
   * 延迟分配的房间类型
   * 这些类型在玩家进入时才确定具体房间（支持不重复和池耗尽重置）
   *
   * 默认：["battle", "event"]
   */
  lazyTypes?: RoomType[]

  /**
   * 立即分配的房间类型
   * 这些类型在地图生成时就确定具体房间（支持种子系统）
   *
   * 默认：["pool", "blackStore"]
   */
  eagerTypes?: RoomType[]

  /**
   * 池耗尽策略（针对延迟分配的类型）
   */
  exhaustionStrategy?: {
    [roomType: string]: "reset" | "allow-repeat" | "error"
  }

  /**
   * 是否追踪已使用的房间（用于不重复）
   * - true: 追踪已使用的房间，避免重复（默认）
   * - false: 不追踪，允许重复
   */
  trackUsedRooms?: boolean
}

/**
 * 解析层级配置
 * 将 "first"、"last"、"beforeLast" 转换为实际的层级数字
 */
export function resolveLayerIndex(
  layer: number | "first" | "last" | "beforeLast",
  totalLayers: number
): number {
  if (typeof layer === "number") {
    return layer
  }

  switch (layer) {
    case "first":
      return 0
    case "last":
      return totalLayers - 1
    case "beforeLast":
      return totalLayers - 2
    default:
      return 0
  }
}

/**
 * 默认地图配置
 */
export const defaultFloorMapConfig: FloorMapConfig = {
  // ==================== 基础结构 ====================
  layers: 15,

  nodesPerLayer: {
    min: 3,
    max: 5
  },

  nodeCountRules: {
    // 起点层使用 nodesPerLayer 范围（2-5个节点）
    bossLayer: 1                // Boss层1个节点
  },

  connectionDensity: {
    min: 1,
    max: 3
  },

  // ==================== 房间分配 ====================
  roomTypeWeights: {
    battle: 50,
    eliteBattle: 10,
    event: 20,
    pool: 10,
    blackStore: 10
  },

  layerSpecificWeights: {
    0: { battle: 100, eliteBattle: 0, event: 0, pool: 0, blackStore: 0 }
    // 其他层使用默认权重
  },

  layerLayouts: {
    7: {
      roomTypes: ["treasure"]  // 第8层：宝箱房（未实现）
    },
    13: {
      roomTypes: ["pool", "pool", "pool"]
    },
    14: {
      roomKeys: ["battle_boss_default"]
    }
  },

  // 房间分配策略
  roomAssignmentStrategy: {
    lazyTypes: ["battle", "event"],  // 战斗和事件延迟分配
    eagerTypes: ["pool", "blackStore"],  // 休息和商店立即分配

    exhaustionStrategy: {
      battle: "reset",  // 战斗池耗尽后重置
      event: "reset"    // 事件池耗尽后重置
    },

    trackUsedRooms: true  // 追踪已使用的房间
  },

  // ==================== 约束规则 ====================
  constraints: {
    global: {
      minCount: {
        pool: 3,
        blackStore: 2
      },
      maxCount: {
        eliteBattle: 5
      }
    },

    placement: {
      parent: {
        noSelfFollow: ["eliteBattle", "pool", "blackStore"]
      },

      sibling: {
        uniqueInLayer: ["eliteBattle", "pool", "blackStore"],

        maxSameTypeInLayer: {
          battle: 5,
          event: 2
        },

        requireDiversity: true
      }
    }
  },

  // ==================== 其他配置 ====================
  validationStrategy: {
    maxRetries: 3,
    fixOnFailure: true,
    revalidateAfterFix: true,
    throwOnFailure: false
  },

  nodePositionConfig: {
    layerHeight: 100,
    horizontalOffset: { min: -20, max: 20 },
    verticalOffset: { min: -10, max: 10 }
  },

  roomPools: {
    battles: [],
    eliteBattles: [],
    events: [],
    pools: [],
    blackStores: []
  }
  // 注意：seed 由 GameRun 提供，不在默认配置中设置
}
