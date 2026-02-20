/**
 * 地图生成器
 * 负责生成整个楼层的地图
 */

import { FloorMap } from "./FloorMap"
import { createMapNode, type MapNode } from "./MapNode"
import type { FloorMapConfig, LayerLayout, RoomTypeWeights } from "@/core/types/FloorMapConfig"
import { resolveLayerIndex } from "@/core/types/FloorMapConfig"
import type { RoomType } from "@/core/objects/room/Room"
import { SeededRandom } from "@/core/utils/SeededRandom"

/**
 * 约束违规信息
 */
interface Violation {
  type: "minCount" | "maxCount" | "minSpacing" | "parentRule" | "siblingRule"
  message: string
  roomType?: RoomType
  needed?: number
  actual?: number
}

/**
 * 地图生成器类
 */
export class MapGenerator {
  private config: FloorMapConfig
  private rng: SeededRandom
  private usedRooms: Map<RoomType, Set<string>> = new Map()

  constructor(config: FloorMapConfig) {
    this.config = config
    this.rng = new SeededRandom(config.seed || Date.now())

    // 初始化已使用房间追踪
    if (config.roomAssignmentStrategy?.trackUsedRooms !== false) {
      const lazyTypes = config.roomAssignmentStrategy?.lazyTypes || ["battle", "event"]
      for (const type of lazyTypes) {
        this.usedRooms.set(type as RoomType, new Set())
      }
    }
  }

  /**
   * 生成地图
   */
  generate(): FloorMap {
    // 如果有自定义策略，完全接管生成流程
    if (this.config.validationStrategy?.customStrategy) {
      return this.config.validationStrategy.customStrategy(
        this.generateInternal(),
        this.config,
        () => this.generateInternal()
      )
    }

    // 标准生成流程（带重试和修正）
    const maxRetries = this.config.validationStrategy?.maxRetries ?? 3
    let map: FloorMap | null = null
    let violations: Violation[] = []

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      map = this.generateInternal()
      violations = this.validateMap(map)

      if (violations.length === 0) {
        console.log(`[MapGenerator] 地图生成成功（第${attempt + 1}次尝试）`)
        return map
      }

      if (attempt < maxRetries) {
        console.warn(`[MapGenerator] 第${attempt + 1}次生成不满足约束，重试...`)
      }
    }

    // 所有重试都失败
    console.warn(`[MapGenerator] ${maxRetries + 1}次尝试都不满足约束`)

    // 是否修正
    const fixOnFailure = this.config.validationStrategy?.fixOnFailure ?? true
    if (fixOnFailure && map) {
      console.log("[MapGenerator] 尝试修正地图...")

      if (this.config.validationStrategy?.customFix) {
        this.config.validationStrategy.customFix(map, violations, this.config)
      } else {
        this.fixMap(map, violations)
      }

      // 修正后是否再次验证
      const revalidate = this.config.validationStrategy?.revalidateAfterFix ?? true
      if (revalidate) {
        const newViolations = this.validateMap(map)
        if (newViolations.length > 0) {
          console.warn("[MapGenerator] 修正后仍有约束违规：")
          for (const v of newViolations) {
            console.warn(`  - ${v.message}`)
          }
        } else {
          console.log("[MapGenerator] 修正后验证通过")
        }
      }
    }

    // 是否抛出错误
    const throwOnFailure = this.config.validationStrategy?.throwOnFailure ?? false
    if (throwOnFailure && violations.length > 0) {
      throw new Error(`地图生成失败：${violations.map(v => v.message).join("; ")}`)
    }

    return map!
  }

  /**
   * 内部生成逻辑（单次生成）
   */
  private generateInternal(): FloorMap {
    const map = new FloorMap(this.config.layers)

    // 1. 生成所有层的节点
    for (let layer = 0; layer < this.config.layers; layer++) {
      const nodes = this.generateLayer(layer)
      for (const node of nodes) {
        map.addNode(node)
      }
    }

    // 2. 生成连接
    for (let layer = 0; layer < this.config.layers - 1; layer++) {
      const currentLayer = map.getLayer(layer)
      const nextLayer = map.getLayer(layer + 1)
      this.generateConnections(currentLayer, nextLayer)
    }

    // 3. 分配房间类型
    this.assignRoomTypes(map)

    // 4. 分配具体房间key（仅 eager 类型）
    this.assignRoomKeys(map)

    // 5. 验证连通性
    const firstLayer = map.getLayer(0)
    if (firstLayer.length > 0) {
      const startNode = firstLayer[0]
      const isValid = map.validateConnectivity(startNode.id)
      if (!isValid) {
        console.warn("[MapGenerator] 地图连通性验证失败，可能存在不可达节点")
      }
    }

    return map
  }

  /**
   * 生成一层的节点
   */
  private generateLayer(layer: number): MapNode[] {
    // 检查是否有层级布局配置
    const layerLayout = this.config.layerLayouts?.[layer]
    let nodeCount: number

    if (layerLayout?.nodeCount !== undefined) {
      nodeCount = layerLayout.nodeCount
    } else if (this.config.nodeCountRules) {
      // 使用高级节点数量规则
      const rules = this.config.nodeCountRules

      if (layer === 0 && rules.startLayer !== undefined) {
        nodeCount = rules.startLayer
      } else if (layer === this.config.layers - 1 && rules.bossLayer !== undefined) {
        nodeCount = rules.bossLayer
      } else if (rules.useDynamicMiddleRange && rules.startLayer !== undefined) {
        const min = 2
        const max = rules.startLayer * 2 - 1
        nodeCount = min + Math.floor(this.rng.next() * (max - min + 1))
      } else {
        const { min, max } = this.config.nodesPerLayer
        nodeCount = min + Math.floor(this.rng.next() * (max - min + 1))
      }
    } else {
      // 使用简单配置
      const { min, max } = this.config.nodesPerLayer
      nodeCount = min + Math.floor(this.rng.next() * (max - min + 1))
    }

    const nodes: MapNode[] = []

    for (let i = 0; i < nodeCount; i++) {
      // 计算水平位置（均匀分布 + 随机偏移）
      let x = nodeCount === 1 ? 0.5 : i / (nodeCount - 1)

      // 应用随机偏移
      if (this.config.nodePositionConfig?.horizontalOffset) {
        const { min, max } = this.config.nodePositionConfig.horizontalOffset
        const offset = (min + this.rng.next() * (max - min)) / 100
        x = Math.max(0, Math.min(1, x + offset))
      }

      const node = createMapNode({
        id: `${layer}-${i}`,
        layer,
        roomType: "battle",  // 临时类型，后续会重新分配
        roomKey: "",  // 临时为空，后续会分配
        x
      })

      nodes.push(node)
    }

    return nodes
  }

  /**
   * 生成连接
   */
  private generateConnections(currentLayer: MapNode[], nextLayer: MapNode[]): void {
    for (const node of currentLayer) {
      // 按 x 坐标距离排序
      const sortedNext = [...nextLayer].sort((a, b) => {
        const distA = Math.abs(a.x - node.x)
        const distB = Math.abs(b.x - node.x)
        return distA - distB
      })

      // 随机选择连接数量
      const { min, max } = this.config.connectionDensity
      const connectionCount = Math.min(
        min + Math.floor(this.rng.next() * (max - min + 1)),
        sortedNext.length
      )

      // 连接最近的几个节点
      for (let i = 0; i < connectionCount; i++) {
        node.connections.push(sortedNext[i].id)
      }
    }

    // 确保下一层的每个节点至少被一个节点连接
    for (const nextNode of nextLayer) {
      const isConnected = currentLayer.some(node => node.connections.includes(nextNode.id))
      if (!isConnected) {
        // 找到最近的节点并连接
        const nearest = currentLayer.reduce((closest, node) => {
          const distCurrent = Math.abs(node.x - nextNode.x)
          const distClosest = Math.abs(closest.x - nextNode.x)
          return distCurrent < distClosest ? node : closest
        })
        nearest.connections.push(nextNode.id)
      }
    }
  }

  /**
   * 分配房间类型
   */
  private assignRoomTypes(map: FloorMap): void {
    for (let layer = 0; layer < this.config.layers; layer++) {
      const nodes = map.getLayer(layer)

      // 检查是否有层级布局配置
      const layerLayout = this.config.layerLayouts?.[layer]
      if (layerLayout) {
        this.applyLayerLayout(nodes, layerLayout)
        continue
      }

      // 第一层：简单随机
      if (layer === 0) {
        for (const node of nodes) {
          node.roomType = this.randomRoomType(layer)
        }
        this.ensureLayerDiversity(nodes)
        continue
      }

      // 其他层：考虑父节点和约束
      for (const node of nodes) {
        const parents = map.getParentNodes(node)
        node.roomType = this.assignRoomTypeWithParents(node, parents, layer)
      }

      // 同层多样性检查
      this.ensureLayerDiversity(nodes)
    }
  }

  /**
   * 应用层级布局配置
   */
  private applyLayerLayout(nodes: MapNode[], layout: LayerLayout): void {
    // 模式1：指定具体房间key列表
    if (layout.roomKeys) {
      for (let i = 0; i < Math.min(nodes.length, layout.roomKeys.length); i++) {
        const roomKey = layout.roomKeys[i]
        // 从 roomKey 推断 roomType
        nodes[i].roomType = this.inferRoomTypeFromKey(roomKey)
        nodes[i].roomKey = roomKey
      }
      return
    }

    // 模式2：指定房间类型列表
    if (layout.roomTypes) {
      for (let i = 0; i < Math.min(nodes.length, layout.roomTypes.length); i++) {
        nodes[i].roomType = layout.roomTypes[i]
      }
      return
    }

    // 模式3：混合模式（节点配置列表）
    if (layout.nodes) {
      for (let i = 0; i < Math.min(nodes.length, layout.nodes.length); i++) {
        const nodeConfig = layout.nodes[i]
        if (nodeConfig.roomKey) {
          nodes[i].roomType = this.inferRoomTypeFromKey(nodeConfig.roomKey)
          nodes[i].roomKey = nodeConfig.roomKey
        } else if (nodeConfig.roomType) {
          nodes[i].roomType = nodeConfig.roomType
        }
      }
    }
  }

  /**
   * 从房间key推断房间类型
   */
  private inferRoomTypeFromKey(roomKey: string): RoomType {
    if (roomKey.startsWith("battle_elite")) return "eliteBattle"
    if (roomKey.startsWith("battle_boss")) return "battle"
    if (roomKey.startsWith("battle")) return "battle"
    if (roomKey.startsWith("event")) return "event"
    if (roomKey.startsWith("pool")) return "pool"
    if (roomKey.startsWith("blackStore")) return "blackStore"
    return "battle"
  }

  /**
   * 根据父节点分配房间类型
   */
  private assignRoomTypeWithParents(node: MapNode, parents: MapNode[], layer: number): RoomType {
    // 获取该层的权重配置
    const weights = this.getLayerWeights(layer)

    // 应用父母房间规则
    const parentRules = this.config.constraints?.placement?.parent
    if (parentRules) {
      const parentTypes = parents.map(p => p.roomType)

      // noSelfFollow 规则
      if (parentRules.noSelfFollow) {
        for (const type of parentRules.noSelfFollow) {
          if (parentTypes.includes(type)) {
            weights[type] = 0
          }
        }
      }

      // 细致的父母规则
      if (parentRules.rules) {
        for (const [roomType, rule] of Object.entries(parentRules.rules)) {
          // cannotFollowSelf
          if (rule.cannotFollowSelf && parentTypes.includes(roomType as RoomType)) {
            weights[roomType] = 0
          }

          // cannotFollow
          if (rule.cannotFollow) {
            const hasBlockingParent = rule.cannotFollow.some(t => parentTypes.includes(t))
            if (hasBlockingParent) {
              weights[roomType] = 0
            }
          }

          // mustFollowOneOf
          if (rule.mustFollowOneOf) {
            const hasRequiredParent = rule.mustFollowOneOf.some(t => parentTypes.includes(t))
            if (!hasRequiredParent) {
              weights[roomType] = 0
            }
          }
        }
      }
    }

    return this.weightedRandomRoomType(weights)
  }

  /**
   * 获取层级权重配置
   */
  private getLayerWeights(layer: number): RoomTypeWeights {
    // 层级特定权重优先
    if (this.config.layerSpecificWeights?.[layer]) {
      return { ...this.config.layerSpecificWeights[layer] }
    }
    // 否则使用默认权重
    return { ...this.config.roomTypeWeights }
  }

  /**
   * 确保同层多样性
   */
  private ensureLayerDiversity(nodes: MapNode[]): void {
    const siblingRules = this.config.constraints?.placement?.sibling
    if (!siblingRules) return

    const typeCount: Record<string, number> = {}
    for (const node of nodes) {
      typeCount[node.roomType] = (typeCount[node.roomType] || 0) + 1
    }

    // uniqueInLayer 规则
    if (siblingRules.uniqueInLayer) {
      for (const type of siblingRules.uniqueInLayer) {
        if (typeCount[type] > 1) {
          const sameTypeNodes = nodes.filter(n => n.roomType === type)
          // 保留第一个，其他的改成别的类型
          for (let i = 1; i < sameTypeNodes.length; i++) {
            sameTypeNodes[i].roomType = this.randomRoomType(nodes[0].layer, { exclude: [type] })
          }
        }
      }
    }

    // maxSameTypeInLayer 规则
    if (siblingRules.maxSameTypeInLayer) {
      for (const [type, maxCount] of Object.entries(siblingRules.maxSameTypeInLayer)) {
        if (typeCount[type] > maxCount) {
          const sameTypeNodes = nodes.filter(n => n.roomType === type)
          const toChange = sameTypeNodes.length - maxCount
          for (let i = 0; i < toChange; i++) {
            const randomIndex = Math.floor(this.rng.next() * sameTypeNodes.length)
            sameTypeNodes[randomIndex].roomType = this.randomRoomType(nodes[0].layer, { exclude: [type as RoomType] })
            sameTypeNodes.splice(randomIndex, 1)
          }
        }
      }
    }

    // requireDiversity 规则
    if (siblingRules.requireDiversity && nodes.length > 1) {
      const uniqueTypes = new Set(nodes.map(n => n.roomType))
      if (uniqueTypes.size === 1) {
        // 全是同一类型，强制改变一些
        const toChange = Math.ceil(nodes.length * 0.3)
        for (let i = 0; i < toChange; i++) {
          const randomIndex = Math.floor(this.rng.next() * nodes.length)
          nodes[randomIndex].roomType = this.randomRoomType(nodes[0].layer, { exclude: [nodes[0].roomType] })
        }
      }
    }

    // cannotCoexist 规则
    if (siblingRules.cannotCoexist) {
      for (const [type, conflictTypes] of Object.entries(siblingRules.cannotCoexist)) {
        if (typeCount[type] > 0) {
          for (const conflictType of conflictTypes) {
            if (typeCount[conflictType] > 0) {
              // 有冲突，移除冲突类型
              const conflictNodes = nodes.filter(n => n.roomType === conflictType)
              for (const node of conflictNodes) {
                node.roomType = this.randomRoomType(node.layer, { exclude: [type as RoomType, conflictType] })
              }
            }
          }
        }
      }
    }
  }

  /**
   * 分配具体房间key
   * 只分配 eager 类型，lazy 类型在进入时分配
   */
  private assignRoomKeys(map: FloorMap): void {
    const eagerTypes = this.config.roomAssignmentStrategy?.eagerTypes || ["pool", "blackStore"]

    for (const node of map.getAllNodes()) {
      // 如果已经有roomKey（来自层级布局配置），跳过
      if (node.roomKey) continue

      // 只分配 eager 类型
      if (!eagerTypes.includes(node.roomType)) {
        continue
      }

      // 从房间池中选择
      const pool = this.getRoomPool(node.roomType)
      if (pool.length > 0) {
        // 使用种子随机数生成器
        const nodeRng = this.rng.derive(node.id)
        node.roomKey = nodeRng.choice(pool)
      } else {
        console.warn(`[MapGenerator] 房间池为空: ${node.roomType}`)
        node.roomKey = `${node.roomType}_default`
      }
    }
  }

  /**
   * 延迟分配房间key（在进入房间时调用）
   */
  public assignLazyRoomKey(node: MapNode): string {
    const pool = this.getRoomPool(node.roomType)
    if (pool.length === 0) {
      console.warn(`[MapGenerator] 房间池为空: ${node.roomType}`)
      return `${node.roomType}_default`
    }

    // 检查是否追踪已使用房间
    const trackUsed = this.config.roomAssignmentStrategy?.trackUsedRooms !== false
    const usedSet = this.usedRooms.get(node.roomType)

    if (trackUsed && usedSet) {
      // 过滤掉已使用的房间
      const availablePool = pool.filter(key => !usedSet.has(key))

      if (availablePool.length === 0) {
        // 池耗尽，检查策略
        const strategy = this.config.roomAssignmentStrategy?.exhaustionStrategy?.[node.roomType] || "reset"

        if (strategy === "reset") {
          console.log(`[MapGenerator] ${node.roomType} 池耗尽，重置`)
          usedSet.clear()
          // 重新选择
          const nodeRng = this.rng.derive(node.id)
          const roomKey = nodeRng.choice(pool)
          usedSet.add(roomKey)
          return roomKey
        } else if (strategy === "allow-repeat") {
          console.log(`[MapGenerator] ${node.roomType} 池耗尽，允许重复`)
          const nodeRng = this.rng.derive(node.id)
          return nodeRng.choice(pool)
        } else {
          throw new Error(`${node.roomType} 房间池耗尽且策略为 error`)
        }
      }

      // 从可用池中选择
      const nodeRng = this.rng.derive(node.id)
      const roomKey = nodeRng.choice(availablePool)
      usedSet.add(roomKey)
      return roomKey
    } else {
      // 不追踪，直接随机选择
      const nodeRng = this.rng.derive(node.id)
      return nodeRng.choice(pool)
    }
  }

  /**
   * 获取房间池
   */
  private getRoomPool(roomType: RoomType): string[] {
    switch (roomType) {
      case "battle":
        return this.config.roomPools.battles
      case "eliteBattle":
        return this.config.roomPools.eliteBattles || []
      case "event":
        return this.config.roomPools.events
      case "pool":
        return this.config.roomPools.pools
      case "blackStore":
        return this.config.roomPools.blackStores
      default:
        return []
    }
  }

  /**
   * 随机选择房间类型
   */
  private randomRoomType(layer: number, options?: { exclude?: RoomType[] }): RoomType {
    const weights = this.getLayerWeights(layer)
    return this.weightedRandomRoomType(weights, options)
  }

  /**
   * 按权重随机选择房间类型
   */
  private weightedRandomRoomType(
    weights: Record<string, number>,
    options?: { exclude?: RoomType[] }
  ): RoomType {
    const exclude = options?.exclude || []

    // 过滤掉排除的类型和权重为0的类型
    const validTypes = Object.entries(weights).filter(
      ([type, weight]) => !exclude.includes(type as RoomType) && weight > 0
    )

    if (validTypes.length === 0) {
      console.warn("[MapGenerator] 没有可用的房间类型，使用 battle 作为兜底")
      return "battle"
    }

    // 计算总权重
    const totalWeight = validTypes.reduce((sum, [, weight]) => sum + weight, 0)

    // 随机选择
    let random = this.rng.next() * totalWeight

    for (const [type, weight] of validTypes) {
      random -= weight
      if (random <= 0) {
        return type as RoomType
      }
    }

    // 兜底
    return validTypes[0][0] as RoomType
  }

  /**
   * 验证地图约束
   */
  private validateMap(map: FloorMap): Violation[] {
    const violations: Violation[] = []
    const constraints = this.config.constraints

    if (!constraints) return violations

    // 全局约束验证
    if (constraints.global) {
      const typeCount: Record<string, number> = {}
      for (const node of map.getAllNodes()) {
        typeCount[node.roomType] = (typeCount[node.roomType] || 0) + 1
      }

      // minCount
      if (constraints.global.minCount) {
        for (const [type, minCount] of Object.entries(constraints.global.minCount)) {
          const actual = typeCount[type] || 0
          if (actual < minCount) {
            violations.push({
              type: "minCount",
              message: `${type} 数量不足：需要至少 ${minCount}，实际 ${actual}`,
              roomType: type as RoomType,
              needed: minCount - actual,
              actual
            })
          }
        }
      }

      // maxCount
      if (constraints.global.maxCount) {
        for (const [type, maxCount] of Object.entries(constraints.global.maxCount)) {
          const actual = typeCount[type] || 0
          if (actual > maxCount) {
            violations.push({
              type: "maxCount",
              message: `${type} 数量过多：最多 ${maxCount}，实际 ${actual}`,
              roomType: type as RoomType,
              needed: actual - maxCount,
              actual
            })
          }
        }
      }

      // minSpacing
      if (constraints.global.minSpacing) {
        for (const [type, minSpacing] of Object.entries(constraints.global.minSpacing)) {
          const layers = map.getAllNodes()
            .filter(n => n.roomType === type)
            .map(n => n.layer)
            .sort((a, b) => a - b)

          for (let i = 1; i < layers.length; i++) {
            const spacing = layers[i] - layers[i - 1]
            if (spacing < minSpacing) {
              violations.push({
                type: "minSpacing",
                message: `${type} 间隔不足：第${layers[i - 1]}层和第${layers[i]}层之间间隔${spacing}，需要至少${minSpacing}`,
                roomType: type as RoomType
              })
            }
          }
        }
      }
    }

    return violations
  }

  /**
   * 修正地图
   */
  private fixMap(map: FloorMap, violations: Violation[]): void {
    for (const violation of violations) {
      if (violation.type === "minCount" && violation.roomType && violation.needed) {
        // 找到其他类型的房间，改成需要的类型
        const otherNodes = map.getAllNodes().filter(n => n.roomType !== violation.roomType)
        for (let i = 0; i < violation.needed && i < otherNodes.length; i++) {
          otherNodes[i].roomType = violation.roomType
          otherNodes[i].roomKey = ""  // 清空 roomKey，后续重新分配
        }
      } else if (violation.type === "maxCount" && violation.roomType && violation.needed) {
        // 找到该类型的房间，改成其他类型
        const sameTypeNodes = map.getAllNodes().filter(n => n.roomType === violation.roomType)
        for (let i = 0; i < violation.needed && i < sameTypeNodes.length; i++) {
          sameTypeNodes[i].roomType = this.randomRoomType(sameTypeNodes[i].layer, { exclude: [violation.roomType] })
          sameTypeNodes[i].roomKey = ""
        }
      }
    }

    // 修正后重新分配 roomKey
    this.assignRoomKeys(map)
  }
}
