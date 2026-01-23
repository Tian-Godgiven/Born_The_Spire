<template>
<div class="chara-wrapper">
    <Target :target 
            @mouseenter="showStateDisplay = true"
            @mouseleave="showStateDisplay = false"
            >
        <div class="chara-content">
            <!-- 意图显示（仅敌人） -->
            <div v-if="isEnemy && enemyIntentDisplay" class="intent-display">
                {{ enemyIntentDisplay }}
            </div>

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
        <!-- 状态详情显示 - 放在Target外面，以便正确定位 -->
        <StateDisplay
            v-if="showStateDisplay"
            :target="target"
            :side="side=='left'?'right':'left'"
        />
    </Target>


</div>
</template>

<script setup lang='ts'>
    import { Chara } from '@/core/objects/target/Target';
    import { Enemy } from '@/core/objects/target/Enemy';
    import { computed, ref } from 'vue';
    import Organ from '@/ui/components/object/Organ.vue';
    import Target from "@/ui/components/interaction/chooseTarget/Target.vue";
    import BloodLine from '@/ui/components/object/Target/Chara/components/BloodLine.vue';
    import State from '@/ui/components/object/State.vue';
    import StateDisplay from '@/ui/components/display/StateDisplay.vue';
    import { formatIntentDisplay } from '@/core/objects/system/Intent';

    const {target,side} = defineProps<{target:Chara,side:'left'|"right"}>()

    // target.organs 已经是 computed，直接使用
    const organList = target.organs

    // 状态显示控制
    const showStateDisplay = ref(false)

    // 判断是否是敌人
    const isEnemy = computed(() => target instanceof Enemy)

    // 获取敌人意图显示文本
    const enemyIntentDisplay = computed(() => {
        if (target instanceof Enemy && target.intent) {
            return formatIntentDisplay(target.intent)
        }
        return null
    })
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

    .intent-display {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background: white;
        border: 2px solid black;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10;
    }

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