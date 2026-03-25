<template>
<div class="chara-wrapper">
    <Target :target 
            @mouseenter="showStateDisplay = true"
            @mouseleave="showStateDisplay = false"
            >
        <div class="chara-content">
            <!-- 意图显示（仅敌人） -->
            <div v-if="isEnemy && enemyIntent" class="intent-display">
                <IntentDisplay :intent="enemyIntent" />
            </div>

            <div class="organs">
                <Organ :organ v-for="organ in organList" :key="organ.__id"></Organ>
            </div>
            <div class="bottom">
                <div class="name">
                    {{ target.label }}
                </div>
                <div class="health-and-armor">
                    <BloodLine :target></BloodLine>
                    <!-- 动态渲染所有 healthBarRight 位置的机制 -->
                    <MechanismDisplay :entity="target" position="healthBarRight" />
                </div>
                <div class="states" v-for="state in stateList" :key="state.key">
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
    import { watch, computed, ref } from 'vue';
    import Organ from '@/ui/components/object/Organ.vue';
    import Target from "@/ui/components/interaction/chooseTarget/Target.vue";
    import BloodLine from '@/ui/components/object/Target/Chara/components/BloodLine.vue';
    import State from '@/ui/components/object/State.vue';
    import StateDisplay from '@/ui/components/display/StateDisplay.vue';
    import MechanismDisplay from '@/ui/components/display/MechanismDisplay.vue';
    import IntentDisplay from '@/ui/components/display/IntentDisplay.vue';
    import { getStateModifier } from '@/core/objects/system/modifier/StateModifier';

    const props = defineProps<{target:Chara,side:'left'|"right"}>()

    // 使用 computed 确保 organs 的响应式被正确追踪
    const organList = computed(() => {
        // 获取器官列表
        let organs: any
        if (props.target.organs && typeof props.target.organs === 'object' && 'value' in props.target.organs) {
            // 如果是 ref/computed，访问 .value
            organs = props.target.organs.value
        } else if (Array.isArray(props.target.organs)) {
            // 如果已经是数组（Vue props 自动解包）
            organs = props.target.organs
        } else {
            organs = []
        }

        return organs || []
    })

    // 获取状态列表（通过 StateModifier）
    const stateList = computed(() => {
        const stateModifier = getStateModifier(props.target)
        return stateModifier.states.value
    })

    // 状态显示控制
    const showStateDisplay = ref(false)

    // 判断是否是敌人
    const isEnemy = computed(() => props.target instanceof Enemy)

    // 获取敌人意图对象
    const enemyIntent = computed(() => {
        if (props.target instanceof Enemy && props.target.intent) {
            console.log('[Chara] intent:', props.target.intent.type, 'visibility:', props.target.intent.visibility, 'actions:', props.target.intent.actions.map(c => c.label))
            return props.target.intent
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
        font-size: 12px;
        white-space: nowrap;
        z-index: 10;
        overflow: visible;
    }

    .organs{
        flex-grow: 1;
    }
    .bottom{
        .name{
            text-align: center;
        }
        .health-and-armor {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        flex-shrink: 0;
        position: relative;
        bottom: 0;
    }
}
</style>