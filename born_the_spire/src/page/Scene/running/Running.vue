<template>
<div class="running">    
    <Top></Top>
    <div class="inner">
        <Battle></Battle>
        <TestTool></TestTool>
        <ConnectLine></ConnectLine>
        <LogPane></LogPane>
        <PopUpContainer></PopUpContainer>
    </div>
</div>
</template>

<script setup lang='ts'>
    import Top from "./Top.vue";
    import Battle from "@/page/Scene/running/Battle.vue"
import ConnectLine from "@/components/display/ConnectLine.vue";
import TestTool from "./TestTool.vue";
import PopUpContainer from '@/components/global/PopUpContainer.vue';
import LogPane from "./LogPane.vue";

</script>

<style scoped lang='scss'>
.running{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .top{
        height: 8vh;
    }
    .inner{
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
    
}
</style>