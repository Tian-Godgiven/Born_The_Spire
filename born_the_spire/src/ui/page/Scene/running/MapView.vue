<template>
  <div class="map-view">
    <!-- 地图容器 -->
    <div
      class="map-container"
      ref="mapContainer"
      :class="{ 'is-dragging': isDragging }"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
    >
      <div class="map-content" :style="{ width: svgWidth + 'px', height: svgHeight + 'px' }">
        <!-- SVG层：只画连接线 -->
        <svg class="map-svg" :width="svgWidth" :height="svgHeight">
          <g class="connections-layer">
            <line
              v-for="connection in connections"
              :key="connection.id"
              :x1="connection.x1"
              :y1="connection.y1"
              :x2="connection.x2"
              :y2="connection.y2"
              :class="['connection', connection.state]"
              stroke-width="2"
            />
          </g>
        </svg>

        <!-- HTML层：节点 -->
        <div class="nodes-container">
          <div
            v-for="node in nodes"
            :key="node.id"
            :class="['map-node', node.state]"
            :style="{
              left: node.x + 'px',
              top: node.y + 'px'
            }"
            @click="onNodeClick(node)"
            @mouseenter="hoveredNode = node"
            @mouseleave="hoveredNode = null"
          >
            <!-- Hover效果圆圈（内嵌SVG实现画圆） -->
            <svg class="hover-ring" width="56" height="56" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="#333"
                stroke-width="2"
                class="hover-circle"
              />
            </svg>

            <!-- 节点图标 -->
            <div class="node-icon">{{ getNodeIcon(node) }}</div>

            <!-- 当前节点标记 -->
            <div v-if="node.state === 'current'" class="current-marker"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点信息面板 -->
    <div v-if="hoveredNode" class="node-info-panel">
      <div class="node-info-title">{{ getNodeDisplayName(hoveredNode) }}</div>
      <div class="node-info-layer">第 {{ hoveredNode.layer + 1 }} 层</div>
      <div class="node-info-state">{{ getNodeStateText(hoveredNode) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { nowGameRun, enterRoom } from '@/core/objects/game/run'
import type { MapNode } from '@/core/objects/system/map/MapNode'
import type { RoomType } from '@/core/objects/room/Room'

// 定义 emit
const emit = defineEmits<{
  enterRoom: []
}>()

// 地图配置
const nodeRadius = 20
const layerHeight = 80
const nodeSpacing = 100
const padding = 50

// 响应式数据
const mapContainer = ref<HTMLElement | null>(null)
const hoveredNode = ref<MapNode | null>(null)
const hasScrolledToBottom = ref(false)  // 标记是否已经滚动到底部

// 拖拽滚动相关
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
const hasDragged = ref(false)  // 标记是否发生了拖拽（用于区分点击和拖拽）

// 获取地图数据
const floorMap = computed(() => nowGameRun.floorManager.getCurrentMap())

// 计算SVG尺寸
const svgWidth = computed(() => {
  if (!floorMap.value) return 800
  // 找到最宽的一层
  let maxNodes = 0
  for (let i = 0; i < floorMap.value.totalLayers; i++) {
    const layer = floorMap.value.getLayer(i)
    maxNodes = Math.max(maxNodes, layer.length)
  }
  return maxNodes * nodeSpacing + padding * 2
})

const svgHeight = computed(() => {
  if (!floorMap.value) return 600
  return floorMap.value.totalLayers * layerHeight + padding * 2
})

// 计算节点位置
const nodes = computed(() => {
  if (!floorMap.value) return []

  const result: Array<MapNode & { x: number; y: number }> = []

  for (let layer = 0; layer < floorMap.value.totalLayers; layer++) {
    const layerNodes = floorMap.value.getLayer(layer)
    const layerWidth = (layerNodes.length - 1) * nodeSpacing

    layerNodes.forEach((node, index) => {
      // 计算Y坐标（从下到上）
      const y = svgHeight.value - padding - layer * layerHeight

      // 计算X坐标（居中分布）
      let x: number
      if (layerNodes.length === 1) {
        x = svgWidth.value / 2
      } else {
        const startX = (svgWidth.value - layerWidth) / 2
        x = startX + index * nodeSpacing
      }

      // 应用节点的水平偏移（如果有）
      if (node.x !== undefined && node.x !== 0.5) {
        // node.x 是 0-1 的比例，转换为实际偏移
        const offset = (node.x - 0.5) * nodeSpacing * 0.5
        x += offset
      }

      result.push({
        ...node,
        x,
        y
      })
    })
  }

  return result
})

// 计算连接线
const connections = computed(() => {
  if (!floorMap.value) return []

  const result: Array<{
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    state: string
  }> = []

  nodes.value.forEach(node => {
    node.connections.forEach(targetId => {
      const targetNode = nodes.value.find(n => n.id === targetId)
      if (targetNode) {
        // 确定连接线的状态
        let state = 'locked'
        if (node.state === 'completed' || node.state === 'current') {
          state = 'available'
        }
        if (targetNode.state === 'completed') {
          state = 'completed'
        }

        result.push({
          id: `${node.id}-${targetId}`,
          x1: node.x,
          y1: node.y,
          x2: targetNode.x,
          y2: targetNode.y,
          state
        })
      }
    })
  })

  return result
})

// 获取节点图标
function getNodeIcon(node: MapNode): string {
  const iconMap: Record<RoomType, string> = {
    init: '🏠',
    battle: '⚔️',
    eliteBattle: '💀',
    event: '❓',
    pool: '💤',
    blackStore: '🛒',
    roomSelect: '🚪',
    floorSelect: '🗺️'
  }
  return iconMap[node.roomType] || '❓'
}

// 获取节点显示名称
function getNodeDisplayName(node: MapNode): string {
  const nameMap: Record<RoomType, string> = {
    init: '初始',
    battle: '战斗',
    eliteBattle: '精英战斗',
    event: '事件',
    pool: '休息点',
    blackStore: '商店',
    roomSelect: '房间选择',
    floorSelect: '楼层选择'
  }
  return nameMap[node.roomType] || '未知'
}

// 获取节点状态文本
function getNodeStateText(node: MapNode): string {
  const stateMap = {
    locked: '未解锁',
    available: '可前往',
    current: '当前位置',
    completed: '已完成'
  }
  return stateMap[node.state] || ''
}

// 点击节点
async function onNodeClick(node: MapNode & { x: number; y: number }) {
  // 如果刚刚发生了拖拽，不触发点击
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }

  console.log('[MapView] 点击节点:', node.id, '状态:', node.state, '类型:', node.roomType)

  if (node.state !== 'available') {
    console.log('[MapView] 节点不可用，无法进入')
    return
  }

  // 移动到该节点
  const success = nowGameRun.floorManager.moveToMapNode(node.id)
  if (!success) {
    console.error('[MapView] 移动到节点失败')
    return
  }

  // 如果是 lazy 类型，分配 roomKey
  if (!node.roomKey) {
    const generator = nowGameRun.floorManager.getMapGenerator()
    if (generator) {
      node.roomKey = generator.assignLazyRoomKey(node)
    }
  }

  // 进入房间
  if (node.roomKey) {
    await enterRoom(node.roomKey, node.layer)
    // 进入房间后，通知父组件隐藏地图
    emit('enterRoom')
  } else {
    console.error('[MapView] 节点没有 roomKey')
  }
}

// 拖拽滚动功能
function onMouseDown(e: MouseEvent) {
  // 只响应左键
  if (e.button !== 0) return

  // 只在容器背景上拖拽，不在节点上拖拽
  if ((e.target as HTMLElement).closest('.map-node')) return

  isDragging.value = true
  hasDragged.value = false

  if (mapContainer.value) {
    dragStart.value = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: mapContainer.value.scrollLeft,
      scrollTop: mapContainer.value.scrollTop
    }
  }

  // 阻止默认行为（防止选中文本）
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !mapContainer.value) return

  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y

  // 如果移动距离超过5px，标记为拖拽
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    hasDragged.value = true
  }

  // 更新滚动位置
  mapContainer.value.scrollLeft = dragStart.value.scrollLeft - dx
  mapContainer.value.scrollTop = dragStart.value.scrollTop - dy
}

function onMouseUp() {
  isDragging.value = false

  // 延迟重置 hasDragged，确保点击事件能正确判断
  setTimeout(() => {
    hasDragged.value = false
  }, 50)
}

function onMouseLeave() {
  // 鼠标离开容器时停止拖拽
  isDragging.value = false
}

// 监听地图变化
watch(floorMap, (newMap) => {
  if (newMap) {
    console.log('[MapView] 地图已加载，共', newMap.totalLayers, '层')

    // 首次加载地图时，滚动到底部
    if (!hasScrolledToBottom.value && mapContainer.value) {
      // 使用 nextTick 确保 DOM 已更新
      setTimeout(() => {
        if (mapContainer.value) {
          mapContainer.value.scrollTop = mapContainer.value.scrollHeight
          hasScrolledToBottom.value = true
          console.log('[MapView] 已滚动到底部')
        }
      }, 100)
    }
  }
})

onMounted(() => {
  console.log('[MapView] 组件已挂载')

  // 如果地图已经存在，立即滚动到底部
  if (floorMap.value && !hasScrolledToBottom.value && mapContainer.value) {
    setTimeout(() => {
      if (mapContainer.value) {
        mapContainer.value.scrollTop = mapContainer.value.scrollHeight
        hasScrolledToBottom.value = true
        console.log('[MapView] 已滚动到底部（onMounted）')
      }
    }, 100)
  }
})
</script>

<style scoped lang="scss">
.map-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;

  &.is-dragging {
    cursor: grabbing;
  }
}

.map-content {
  position: relative;
  flex-shrink: 0;
}

.map-svg {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

/* 连接线样式 */
.connection {
  stroke: #ccc;
  transition: stroke 0.3s;

  &.available {
    stroke: #666;
  }

  &.completed {
    stroke: #4caf50;
  }
}

/* 节点容器 */
.nodes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

/* 节点样式 */
.map-node {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  &.available {
    cursor: pointer;
  }

  &.locked {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &.completed {
    opacity: 0.7;
  }
}

/* 节点图标 */
.node-icon {
  font-size: 32px;
  user-select: none;
  pointer-events: none;
  position: relative;
  z-index: 2;
}

/* Hover圆圈样式 - 使用SVG实现画圆效果 */
.hover-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;

  .hover-circle {
    /* 圆的周长：2 * π * 26 ≈ 163 */
    stroke-dasharray: 163;
    stroke-dashoffset: 163;
    transition: stroke-dashoffset 0.4s ease-out;
    transform-origin: center;
    transform: rotate(-90deg); /* 从顶部开始画 */
  }

  .map-node.available:hover & .hover-circle {
    stroke-dashoffset: 0;
  }
}

/* 当前节点标记 */
.current-marker {
  position: absolute;
  width: 66px;
  height: 66px;
  border: 3px solid gold;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* 节点信息面板 */
.node-info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: 2px solid #333;
  padding: 15px;
  min-width: 150px;
}

.node-info-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.node-info-layer {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.node-info-state {
  font-size: 14px;
  color: #333;
}
</style>
