<template>
<div class="running">
    <!-- 顶部内容 -->
    <Top></Top>
    <!-- 房间内容 -->
    <div class="content">
        <!-- 根据房间类型动态显示对应组件 -->
        <component v-if="currentRoomComponent" :is="currentRoomComponent"></component>

        <ConnectLine></ConnectLine>
        <PopUpContainer></PopUpContainer>
    </div>
    <!-- 测试工具 -->
    <div class="tool">
        <TestTool></TestTool>
        <LogPane></LogPane>
    </div>

    <!-- 地图覆盖层 -->
    <MapOverlay ref="mapOverlay" />

    <!-- 回到地图按钮 -->
    <button
        v-if="showBackToMapButton"
        class="back-to-map-btn"
        @click="showMap"
    >
        🗺️ 回到地图
    </button>
</div>
</template>

<script setup lang='ts'>
import { computed, ref, onMounted } from 'vue'
import Top from "./Top/index.vue"
import ConnectLine from "@/ui/components/interaction/chooseTarget/ConnectLine.vue"
import TestTool from "@/ui/page/tool/testTool/TestTool.vue"
import PopUpContainer from '@/ui/components/global/PopUpContainer.vue'
import LogPane from "@/ui/page/tool/logPane/LogPane.vue"
import MapOverlay from "./MapOverlay.vue"
import { nowGameRun } from '@/core/objects/game/run'
import { getRoomComponent } from '@/ui/registry/roomComponentRegistry'
import { setShowMapCallback } from '@/core/hooks/step'

// 获取当前房间对应的组件
const currentRoomComponent = computed(() => {
    const roomType = nowGameRun.currentRoom?.type
    if (!roomType) return null

    const component = getRoomComponent(roomType)
    if (!component) {
        console.warn(`[Running] 未找到房间类型 "${roomType}" 对应的组件`)
    }
    return component
})

// 地图覆盖层引用
const mapOverlay = ref<InstanceType<typeof MapOverlay> | null>(null)

// 追踪用户是否打开过地图（用于控制"回到地图"按钮显示）
const hasOpenedMap = ref(false)

// 显示地图
function showMap() {
    mapOverlay.value?.show()
    // 标记用户已打开过地图
    hasOpenedMap.value = true
}

// 判断是否显示"回到地图"按钮
const showBackToMapButton = computed(() => {
    // 如果地图正在显示，不显示按钮
    if (mapOverlay.value?.visible) return false

    // 检查是否有地图
    const map = nowGameRun.floorManager.getCurrentMap()
    if (!map) return false

    // 检查当前节点状态
    const currentNode = map.getCurrentNode()
    if (!currentNode) return false

    // 只有当前节点已完成时才显示按钮
    if (currentNode.state !== 'completed') return false

    // 必须用户打开过地图后关闭，才显示按钮
    if (!hasOpenedMap.value) return false

    // 检查是否有可选择的下一层节点（available状态）
    const nextNodes = map.getNextNodes()
    const hasAvailableNodes = nextNodes.some(node => node.state === 'available')
    return hasAvailableNodes
})

// 注册显示地图的回调
onMounted(() => {
    setShowMapCallback(showMap)
    console.log('[Running] 地图回调已注册')
})

</script>

<style scoped lang='scss'>
.running{
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .top{
        height: 8vh;
    }
    .content{
        position: relative;
        height: 92vh;
        width: 100%;
        .battle{
            z-index: 0;
        }
        .test{
            z-index: 2;
        }
        .popUpContainer{
            z-index: 1;
        }
    }
    .tool{
        z-index: 100;
        height: 92vh;
        position: absolute;
        width: 100%;
        left: 0;
        top: 8vh;
        pointer-events: none;
        *{
            pointer-events: auto;
        }
    }
}

// 回到地图按钮
.back-to-map-btn {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 50;
    padding: 12px 20px;
    background: white;
    border: 2px solid #333;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}

// 地图弹窗样式
.map-popup {
    position: absolute;
    top: 0;
    left: 5%;
    width: 90%;
    height: 100%;
    z-index: 10;
    background: white;
    border: 2px solid black;
    overflow: auto;
}

// 地图弹窗渐显动画
.map-fade-enter-active,
.map-fade-leave-active {
    transition: opacity 0.3s ease;
}

.map-fade-enter-from,
.map-fade-leave-to {
    opacity: 0;
}
</style>