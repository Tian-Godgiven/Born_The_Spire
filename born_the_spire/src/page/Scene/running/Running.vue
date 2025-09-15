<template>
<div class="running">    
    <Top></Top>
    <div class="content">
        <Battle></Battle>
        <ConnectLine></ConnectLine>
        <PopUpContainer></PopUpContainer>
    </div>
    <div class="tool">
        <TestTool></TestTool>
        <LogPane></LogPane>
    </div>
</div>
</template>

<script setup lang='ts'>
    import Top from "./Top.vue";
    import Battle from "@/page/Scene/running/Battle.vue"
import ConnectLine from "@/components/display/ConnectLine.vue";
import TestTool from "@/page/tool/testTool/TestTool.vue";
import PopUpContainer from '@/components/global/PopUpContainer.vue';
import LogPane from "@/page/tool/logPane/LogPane.vue"

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

    }
    
}
</style>