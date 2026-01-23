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
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import Top from "./Top/index.vue"
import ConnectLine from "@/ui/components/interaction/chooseTarget/ConnectLine.vue"
import TestTool from "@/ui/page/tool/testTool/TestTool.vue"
import PopUpContainer from '@/ui/components/global/PopUpContainer.vue'
import LogPane from "@/ui/page/tool/logPane/LogPane.vue"
import { nowGameRun } from '@/core/objects/game/run'
import { getRoomComponent } from '@/ui/registry/roomComponentRegistry'

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