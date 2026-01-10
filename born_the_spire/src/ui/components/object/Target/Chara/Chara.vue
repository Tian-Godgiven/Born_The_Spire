<template>
<div class="chara-wrapper">
    <Target :target>
        <div
            class="chara-content"
            @mouseenter="showStateDisplay = true"
            @mouseleave="showStateDisplay = false"
        >
            <div class="organs">
                <Organ :organ v-for="organ in organList" :key="organ.__id"></Organ>
            </div>
            <div class="bottom">
                <div class="name">
                    {{ target.label }}
                </div>
                <BloodLine :target></BloodLine>
                <div class="states" v-for="state in target.state" :key="state.key">
                    <State :state></State>
                </div>
            </div>
        </div>
    </Target>

    <!-- 状态详情显示 - 放在Target外面，以便正确定位 -->
    <StateDisplay
        v-if="showStateDisplay"
        :target="target"
        :side
    />
</div>
</template>

<script setup lang='ts'>
    import { Chara } from '@/core/objects/target/Target';
    import { computed, ref } from 'vue';
    import Organ from '@/ui/components/object/Organ.vue';
    import Target from "@/ui/components/interaction/chooseTarget/Target.vue";
    import BloodLine from '@/ui/components/object/Target/Chara/components/BloodLine.vue';
    import State from '@/ui/components/object/State.vue';
    import StateDisplay from '@/ui/components/object/Target/Chara/components/StateDisplay.vue';

    const {target,side} = defineProps<{target:Chara,side:'left'|"right"}>()

    // target.organs 已经是 computed，直接使用
    const organList = target.organs

    // 状态显示控制
    const showStateDisplay = ref(false)
</script>

<style scoped lang='scss'>
.chara-wrapper {
    position: relative;
    width: 200px;
    height: 300px;
    overflow: visible;
}

.chara-content {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    .organs{
        flex-grow: 1;
    }
    .bottom{
        .name{
            text-align: center;
        }
        flex-shrink: 0;
        position: relative;
        bottom: 0;
    }
}
</style>