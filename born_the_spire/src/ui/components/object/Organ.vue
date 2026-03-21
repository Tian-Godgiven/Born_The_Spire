<template>
<div class="organ"
    :class="{ 'temporary': organ.isTemporary, 'has-abilities': hasActiveAbilities }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @click="showDetail = true"
    @contextmenu.prevent="handleRightClick">

    <!-- 临时标识 -->
    <div class="temporary-indicator" v-if="organ.isTemporary">
        临时
    </div>

    <!-- 主动能力标识 -->
    <div class="ability-indicator" v-if="hasActiveAbilities">
        ⚡
    </div>

    {{ organ.label }}:{{ describe }}

    <!-- 词条显示 -->
    <EntryDisplay
        v-if="hovering"
        :entries="organ.entry"
        :side="side ?? 'right'" />

    <!-- 器官详情弹窗 -->
    <OrganDetail
        :organ="organ"
        :visible="showDetail"
        @close="showDetail = false"
    />
</div>
</template>

<script setup lang='ts'>
    import { getDescribe } from '@/ui/hooks/express/describe';
import { Organ } from '@/core/objects/target/Organ';
import { computed, ref } from 'vue';
import EntryDisplay from '@/ui/components/display/EntryDisplay.vue';
import OrganDetail from '@/ui/components/interaction/OrganDetail.vue';
import { handleItemRightClick } from '@/core/hooks/activeAbility';
import { nowPlayer } from '@/core/objects/game/run';

    const {organ, side} = defineProps<{
        organ: Organ
        side?: 'left' | 'right'  // 可选，默认右侧
    }>()

    const hovering = ref(false)
    const showDetail = ref(false)

    const describe = computed(()=>{
        return getDescribe(organ.describe, organ)
    })

    const hasActiveAbilities = computed(() => {
        return organ.activeAbilities && organ.activeAbilities.length > 0
    })

    async function handleRightClick() {
        if (!hasActiveAbilities.value) return

        try {
            await handleItemRightClick(
                organ,
                nowPlayer,
                organ.activeAbilities!
            )
        } catch (error) {
            console.error('[Organ] 右键点击处理失败:', error)
        }
    }
</script>

<style scoped lang='scss'>
.organ{
    position: relative;  // 为 EntryDisplay 提供定位上下文
    width: 100px;
    border: 2px solid black;
    cursor: pointer;

    // 临时器官样式
    &.temporary {
        border-style: dashed;
        border-color: #f59e0b;
        background-color: #fffbeb;
    }

    // 有主动能力的器官样式
    &.has-abilities {
        border-color: #3b82f6;

        &:hover {
            border-color: #1d4ed8;
            box-shadow: 0 0 0 1px #3b82f6;
        }
    }

    .temporary-indicator {
        position: absolute;
        top: -2px;
        right: -2px;
        background-color: #f59e0b;
        color: white;
        font-size: 8px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 0 0 0 4px;
        z-index: 1;
    }

    .ability-indicator {
        position: absolute;
        top: -2px;
        left: -2px;
        background-color: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 0 0 4px 0;
        z-index: 1;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.temporary:hover {
        background: #fef3c7;
    }

    &.has-abilities:hover {
        background: #eff6ff;
    }

    &.temporary.has-abilities:hover {
        background: linear-gradient(45deg, #fef3c7 50%, #eff6ff 50%);
    }
}
</style>