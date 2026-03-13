<template>
<div class="relic"
    :class="{ 'has-abilities': hasActiveAbilities }"
    @contextmenu.prevent="handleRightClick">

    <!-- 主动能力标识 -->
    <div class="ability-indicator" v-if="hasActiveAbilities">
        ⚡
    </div>

    <div>{{ relic.label }}</div>
</div>
</template>

<script setup lang='ts'>
    import { Relic } from '@/core/objects/item/Subclass/Relic';
    import { computed } from 'vue';
    import { handleItemRightClick } from '@/core/hooks/activeAbility';
    import { nowPlayer } from '@/core/objects/game/run';

    const {relic} = defineProps<{relic:Relic}>()

    const hasActiveAbilities = computed(() => {
        return relic.activeAbilities && relic.activeAbilities.length > 0
    })

    async function handleRightClick() {
        if (!hasActiveAbilities.value) return

        try {
            await handleItemRightClick(
                relic,
                nowPlayer,
                relic.activeAbilities!
            )
        } catch (error) {
            console.error('[Relic] 右键点击处理失败:', error)
        }
    }
</script>

<style scoped lang='scss'>
.relic {
    position: relative;
    border: 2px solid black;
    padding: 8px;
    cursor: pointer;

    &.has-abilities {
        border-color: #3b82f6;

        &:hover {
            border-color: #1d4ed8;
            box-shadow: 0 0 0 1px #3b82f6;
            background: #eff6ff;
        }
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
}
</style>