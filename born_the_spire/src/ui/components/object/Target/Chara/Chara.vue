<template>
<!-- 飘字层必须挂在 CharaAnimator 外面：死亡演出会把动画容器整个淡出并 visibility: hidden，
     放在里面的话致命一击的伤害数字会跟着一起消失 -->
<div class="chara-wrapper" :class="'ui-size-' + uiSize">
<CharaAnimator ref="animator" :target="target" class="chara-body">
    <!-- 意图显示（仅敌人，死亡后隐藏）
         必须放在 Popover 触发区之外：它自己已经带了悬停详情，落在触发区里的话，
         鼠标划到意图上会连带把角色状态浮层也弹出来 -->
    <div v-if="isEnemy && enemyIntent && !isDeadOrDying" class="intent-display">
        <IntentDisplay :intent="enemyIntent" />
    </div>

    <Popover
        class="chara-popover"
        :placement="popupSide"
        :anchor="hoveredOrganElement"
        :max-width="hoverShowsMilestones ? 900 : 600"
        :offset="12"
        :disabled="!hasPopoverContent"
        @update:show="onPopoverShow"
    >
        <Target :target>
            <div class="chara-content">
                <div class="organs">
                    <Organ
                        :organ
                        v-for="organ in organList"
                        :key="organ.__id"
                        :disabled="isOrganDisabledCheck(organ)"
                        @hover="onOrganHover"
                    ></Organ>
                </div>
                <div class="bottom">
                    <div class="name">
                        {{ target.label }}
                    </div>
                    <div class="health-and-armor">
                        <BloodLine :target></BloodLine>
                        <MechanismDisplay
                            :entity="target"
                            position="healthBarRight"
                            :align="side === 'right' ? 'left' : 'right'"
                        />
                    </div>
                </div>
                <div class="states" v-if="stateList.length > 0 && !isDeadOrDying">
                    <State v-for="state in stateList" :key="state.key" :state></State>
                </div>
            </div>
        </Target>

        <!-- 战斗悬停只出介绍；里程碑留给选器官 / 洗涤，除非这器官会在战斗里自己升级 -->
        <template #content>
            <div class="popover-stack" :class="popupSide">
                <template v-if="hoveredOrgan">
                    <EntryDisplay
                        v-if="showOrganDescribe"
                        :entries="hoveredOrgan.entry"
                    />
                    <OrganHoverContent
                        v-else
                        :organ="hoveredOrgan"
                        :reverse="popupSide === 'left'"
                        :show-milestones="hoverShowsMilestones"
                    />
                </template>
                <StateDisplay v-if="stateList.length > 0" :target="target" />
            </div>
        </template>
    </Popover>
</CharaAnimator>

<HitText :target="target" />
</div>
</template>

<script setup lang='ts'>
    import { Chara } from '@/core/objects/target/Target';
    import { Enemy } from '@/core/objects/target/Enemy';
    import { computed, ref, shallowRef } from 'vue';
    import Organ from '@/ui/components/object/Organ.vue';
    import Target from "@/ui/components/interaction/chooseTarget/Target.vue";
    import BloodLine from '@/ui/components/object/Target/Chara/components/BloodLine.vue';
    import CharaAnimator from '@/ui/components/object/Target/Chara/components/CharaAnimator.vue';
    import HitText from '@/ui/components/object/Target/Chara/components/HitText.vue';
    import State from '@/ui/components/object/State.vue';
    import StateDisplay from '@/ui/components/display/StateDisplay.vue';
    import EntryDisplay from '@/ui/components/display/EntryDisplay.vue';
    import OrganHoverContent from '@/ui/components/interaction/OrganHoverContent.vue';
    import Popover from '@/ui/components/global/Popover.vue';
    import { settings } from '@/core/persistence/settings';
    import MechanismDisplay from '@/ui/components/display/MechanismDisplay.vue';
    import IntentDisplay from '@/ui/components/display/IntentDisplay.vue';
    import { getStateModifier } from '@/core/objects/system/modifier/StateModifier';
    import { isOrganDisabled } from '@/core/effects/organ/disableOrgan';
    import type { Organ as OrganClass } from '@/core/objects/target/Organ';

    const props = defineProps<{target:Chara,side:'left'|"right"}>()

    // 浮层一律朝屏幕中间弹：玩家在左半屏就往右开，敌人在右半屏就往左开
    // 器官介绍和角色状态并排装在同一个浮层容器里，不再互相排斥
    const popupSide = computed(() => props.side === 'left' ? 'right' : 'left')

    // 通过 ref 访问 CharaAnimator 暴露的动画状态
    const animator = ref<InstanceType<typeof CharaAnimator>>()
    const isDeadOrDying = computed(() => animator.value?.isDying || animator.value?.isDead)

    // 检查器官是否被禁用
    function isOrganDisabledCheck(organ: OrganClass): boolean {
        return isOrganDisabled(organ)
    }

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

    // 当前悬停的器官，由 Organ 组件上报；element 用作浮层的定位锚点，让浮层贴住器官方块
    const hoveredOrgan = shallowRef<OrganClass | null>(null)
    const hoveredOrganElement = shallowRef<HTMLElement | null>(null)
    const hoverShowsMilestones = computed(() => !!hoveredOrgan.value?.upgradeConfig?.combatUpgrade)

    function onOrganHover(payload: { organ: OrganClass, element: HTMLElement | null } | null) {
        // 离开器官时不清空：浮层还开着就说明鼠标要么仍在角色上、要么已经移进浮层，
        // 这时候抽掉器官介绍会让人没法去点介绍里的卡牌。真正的清理交给浮层关闭
        if (!payload) return
        hoveredOrgan.value = payload.organ
        hoveredOrganElement.value = payload.element
    }

    function onPopoverShow(show: boolean) {
        if (show) return
        hoveredOrgan.value = null
        hoveredOrganElement.value = null
    }

    // 器官那一列有没有东西可显示
    // 介绍常驻显示在方块上时浮层只补充词条说明，没有词条就没什么可补充的
    const hasOrganPopoverContent = computed(() => {
        const organ = hoveredOrgan.value
        if (!organ) return false
        if (showOrganDescribe.value) return !!organ.entry?.length
        return true
    })

    // 两列都空就不弹空浮层
    const hasPopoverContent = computed(() => {
        if (isDeadOrDying.value) return false
        return stateList.value.length > 0 || hasOrganPopoverContent.value
    })

    // 器官介绍常驻显示时，浮层只补充词条说明，避免与方块上的文字重复
    const showOrganDescribe = computed(() => settings.showOrganDescribe)

    // 判断是否是敌人
    const isEnemy = computed(() => props.target instanceof Enemy)

    // 敌人卡片尺寸来自这场战斗的实例配置；玩家固定 normal
    const uiSize = computed(() => {
        if (props.target instanceof Enemy) return props.target.uiSize
        return "normal"
    })

    // 获取敌人意图对象
    const enemyIntent = computed(() => {
        if (props.target instanceof Enemy && props.target.intent) {
            return props.target.intent
        }
        return null
    })
</script>

<style scoped lang='scss'>
.chara-wrapper {
    position: relative;
    width: var(--layout-chara-width);
    height: var(--layout-chara-height);
    overflow: visible;

    &.ui-size-small {
        width: 140px;
        height: 210px;
    }

    &.ui-size-big {
        width: 260px;
        height: 390px;
    }
}

// 动画容器撑满外层，飘字层再叠在它上面
.chara-body {
    width: 100%;
    height: 100%;
}

// Popover 的触发区包裹层夹在动画容器和 Target 之间，得把尺寸透传下去
.chara-popover {
    width: 100%;
    height: 100%;
}

// 意图挂在 .chara-wrapper 上而不是 .chara-content 里，两者同尺寸所以位置不变
.intent-display {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
    overflow: visible;
}

// 浮层列：器官介绍与角色状态并排成一行，整体由 Popover 摆到屏幕中间那侧
// 内侧（靠近触发它的器官方块）放器官介绍，外侧放角色状态
.popover-stack {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: default;

    &.right { flex-direction: row; }

    // 朝左展开时反向排列，让器官介绍仍落在最靠近器官方块的一侧
    &.left { flex-direction: row-reverse; }
}

.chara-content {
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: relative;   // bottom / states 的定位上下文

    .organs{
        flex-grow: 1;

        :deep(.organ) {
            width: 100%;
            box-sizing: border-box;
        }
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
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
    }
    .states {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 2px;
        margin-top: 2px;
    }
}
</style>