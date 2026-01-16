<template>
<div class="running">
    <Top></Top>
    <div class="content">
        <Battle></Battle>
        <ConnectLine></ConnectLine>
        <PopUpContainer></PopUpContainer>

        <!-- 地图弹窗 -->
        <Transition name="map-fade" appear>
            <div v-if="isMapVisible" class="map-popup">
                <EnemySelectMap></EnemySelectMap>
            </div>
        </Transition>
    </div>
    <div class="tool">
        <TestTool></TestTool>
        <LogPane></LogPane>
    </div>
</div>
</template>

<script setup lang='ts'>
    import Top from "./Top/index.vue";
    import Battle from "@/ui/page/Scene/running/Battle.vue"
import ConnectLine from "@/ui/components/interaction/chooseTarget/ConnectLine.vue";
import TestTool from "@/ui/page/tool/testTool/TestTool.vue";
import PopUpContainer from '@/ui/components/global/PopUpContainer.vue';
import LogPane from "@/ui/page/tool/logPane/LogPane.vue"
import EnemySelectMap from "@/ui/page/Scene/test/EnemySelectMap.vue"
import { onMounted } from 'vue';
import { isMapVisible, showMap } from '@/ui/hooks/global/mapDisplay';

// 组件挂载时自动显示地图
onMounted(() => {
    showMap()
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