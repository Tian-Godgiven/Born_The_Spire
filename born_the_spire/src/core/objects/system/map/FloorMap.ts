/**
 * 楼层地图
 * 管理整个楼层的地图节点和连接关系
 */

import type { MapNode } from "./MapNode"
import { serializeMapNode, deserializeMapNode } from "./MapNode"

/**
 * 楼层地图类
 */
export class FloorMap {
  /** 所有节点（key: nodeId, value: MapNode） */
  private nodes: Map<string, MapNode> = new Map()

  /** 按层级组织的节点（key: layer, value: nodeIds） */
  private layers: Map<number, string[]> = new Map()

  /** 总层数 */
  public readonly totalLayers: number

  /** 当前节点ID */
  private currentNodeId: string | null = null

  /** 开发模式：允许自由移动到任何节点 */
  public devMode: boolean = false

  constructor(totalLayers: number) {
    this.totalLayers = totalLayers
  }

  /**
   * 添加节点
   */
  addNode(node: MapNode): void {
    this.nodes.set(node.id, node)

    // 添加到层级索引
    if (!this.layers.has(node.layer)) {
      this.layers.set(node.layer, [])
    }
    this.layers.get(node.layer)!.push(node.id)
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): MapNode | null {
    return this.nodes.get(nodeId) || null
  }

  /**
   * 获取某一层的所有节点
   */
  getLayer(layer: number): MapNode[] {
    const nodeIds = this.layers.get(layer) || []
    return nodeIds.map(id => this.nodes.get(id)!).filter(Boolean)
  }

  /**
   * 获取所有节点
   */
  getAllNodes(): MapNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * 获取当前节点
   */
  getCurrentNode(): MapNode | null {
    if (!this.currentNodeId) return null
    return this.getNode(this.currentNodeId)
  }

  /**
   * 设置当前节点
   */
  setCurrentNode(nodeId: string): void {
    const node = this.getNode(nodeId)
    if (!node) {
      console.error(`[FloorMap] 节点不存在: ${nodeId}`)
      return
    }

    // 更新旧节点状态（注意：不在这里标记为 completed）
    // completed 状态应该在房间完成时由 completeCurrentNode() 设置
    if (this.currentNodeId && this.currentNodeId !== nodeId) {
      const oldNode = this.getNode(this.currentNodeId)
      if (oldNode && oldNode.state === "current") {
        // 如果旧节点还是 current 状态，说明没有完成，保持 current
        // 这种情况不应该发生，但为了安全起见保留
        console.warn(`[FloorMap] 旧节点 ${this.currentNodeId} 未完成就切换到新节点`)
      }
    }

    // 更新新节点状态
    this.currentNodeId = nodeId
    node.state = "current"

    // 注意：不在这里调用 updateAvailableNodes()
    // 下一层节点应该在完成当前房间后才解锁
  }

  /**
   * 完成当前节点（房间完成时调用）
   */
  completeCurrentNode(): void {
    if (!this.currentNodeId) {
      console.warn(`[FloorMap] 没有当前节点`)
      return
    }

    const currentNode = this.getNode(this.currentNodeId)
    if (!currentNode) {
      console.error(`[FloorMap] 当前节点不存在: ${this.currentNodeId}`)
      return
    }

    // 标记当前节点为已完成
    currentNode.state = "completed"

    // 解锁下一层节点
    this.updateAvailableNodes()
  }

  /**
   * 获取可前进的节点
   */
  getNextNodes(): MapNode[] {
    const current = this.getCurrentNode()
    if (!current) return []

    return current.connections
      .map(id => this.getNode(id))
      .filter((node): node is MapNode => node !== null)
  }

  /**
   * 前进到下一个节点
   */
  moveToNode(nodeId: string): boolean {
    const targetNode = this.getNode(nodeId)
    if (!targetNode) {
      console.error(`[FloorMap] 节点不存在: ${nodeId}`)
      return false
    }

    // 特殊情况：第一层节点（没有当前节点时）
    if (!this.currentNodeId && targetNode.layer === 0) {
      if (targetNode.state === "available") {
        this.setCurrentNode(nodeId)
        return true
      } else {
        console.error(`[FloorMap] 第一层节点不可用: ${nodeId}`)
        return false
      }
    }

    // 开发模式：允许移动到任何 available 节点
    if (this.devMode && targetNode.state === "available") {
      this.setCurrentNode(nodeId)
      return true
    }

    // 正常情况：检查是否在可前进节点中
    const nextNodes = this.getNextNodes()
    const isNextNode = nextNodes.find(n => n.id === nodeId)

    if (!isNextNode) {
      console.error(`[FloorMap] 无法前进到节点: ${nodeId}`)
      return false
    }

    this.setCurrentNode(nodeId)
    return true
  }

  /**
   * 获取节点的父节点（上一层连接到此节点的节点）
   */
  getParentNodes(node: MapNode): MapNode[] {
    if (node.layer === 0) return []

    const previousLayer = this.getLayer(node.layer - 1)
    return previousLayer.filter(parent => parent.connections.includes(node.id))
  }

  /**
   * 更新可达节点状态
   */
  private updateAvailableNodes(): void {
    // 重置所有节点状态（除了 completed 和 current）
    for (const node of this.nodes.values()) {
      if (node.state !== "completed" && node.state !== "current") {
        node.state = "locked"
      }
    }

    // 标记可达节点
    const nextNodes = this.getNextNodes()
    for (const node of nextNodes) {
      node.state = "available"
    }
  }

  /**
   * 初始化地图（设置起始节点）
   */
  initialize(startNodeId: string): void {
    this.setCurrentNode(startNodeId)
  }

  /**
   * 验证地图连通性
   * 检查是否所有节点都可以从起始节点到达
   */
  validateConnectivity(startNodeId: string): boolean {
    const visited = new Set<string>()
    const queue: string[] = [startNodeId]

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue

      visited.add(nodeId)
      const node = this.getNode(nodeId)
      if (!node) continue

      for (const nextId of node.connections) {
        if (!visited.has(nextId)) {
          queue.push(nextId)
        }
      }
    }

    // 检查是否所有节点都被访问
    const allNodeIds = Array.from(this.nodes.keys())
    const unreachable = allNodeIds.filter(id => !visited.has(id))

    if (unreachable.length > 0) {
      console.warn(`[FloorMap] 发现不可达节点: ${unreachable.join(", ")}`)
      return false
    }

    return true
  }

  /**
   * 获取所有可能的路径（从起点到终点）
   */
  getAllPaths(startNodeId: string): MapNode[][] {
    const paths: MapNode[][] = []
    const currentPath: MapNode[] = []

    const dfs = (nodeId: string) => {
      const node = this.getNode(nodeId)
      if (!node) return

      currentPath.push(node)

      // 如果是最后一层，记录路径
      if (node.layer === this.totalLayers - 1) {
        paths.push([...currentPath])
      } else {
        // 继续探索
        for (const nextId of node.connections) {
          dfs(nextId)
        }
      }

      currentPath.pop()
    }

    dfs(startNodeId)
    return paths
  }

  /**
   * 序列化
   */
  serialize(): any {
    return {
      totalLayers: this.totalLayers,
      nodes: Array.from(this.nodes.values()).map(serializeMapNode),
      currentNodeId: this.currentNodeId
    }
  }

  /**
   * 反序列化
   */
  static deserialize(data: any): FloorMap {
    const map = new FloorMap(data.totalLayers)

    // 恢复节点
    for (const nodeData of data.nodes) {
      const node = deserializeMapNode(nodeData)
      map.addNode(node)
    }

    // 恢复当前节点
    if (data.currentNodeId) {
      map.currentNodeId = data.currentNodeId
    }

    return map
  }
}
