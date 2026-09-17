<template>
    <span
        v-if="area === 'info' && marked"
        class="beast-caption"
        :class="{ 'beast-loot-wanted': wanted, 'beast-loot-forced': forced }"
    >
        {{ forced ? '🐕 小兽霸占了这份' : '🐕 小兽想要这份' }}
    </span>
    <Button
        v-else-if="area === 'action' && wanted"
        class="beast-feed-btn"
        label="喂养"
        :click="feed"
    />
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue"
import type { Reward } from "@/core/objects/reward/Reward"
import type { RewardRowAddonArea } from "@/static/registry/rewardRowAddonRegistry"
import Button from "@/ui/components/global/Button.vue"
import { feedBeastLoot, isBeastForced, isBeastMarked } from "@/ui/hooks/interaction/beastLoot"

const { reward, area } = defineProps({
    reward: { type: Object as PropType<Reward>, required: true },
    area: { type: String as PropType<RewardRowAddonArea>, required: true }
})

const marked = computed(() => isBeastMarked(reward) && !reward.isClaimed())
const forced = computed(() => marked.value && isBeastForced(reward))
const wanted = computed(() => marked.value && !forced.value)

function feed() {
    feedBeastLoot(reward)
}
</script>

<style scoped lang="scss">
.beast-caption {
    font-size: 13px;
    font-weight: bold;
    color: #333;
}

.beast-feed-btn {
    opacity: 0;
    pointer-events: none;
}
</style>

<style lang="scss">
.reward-row:hover .beast-feed-btn,
.reward-row:focus-within .beast-feed-btn {
    opacity: 1;
    pointer-events: auto;
}

@media (hover: none) {
    .reward-row .beast-feed-btn {
        opacity: 1;
        pointer-events: auto;
    }
}

.reward-row:has(.beast-loot-wanted),
.reward-row:has(.beast-loot-forced) {
    background: rgba(0, 0, 0, 0.05);
    outline: 2px solid black;
    outline-offset: -4px;
}

.reward-row:has(.beast-loot-wanted):hover,
.reward-row:has(.beast-loot-forced):hover {
    background: rgba(0, 0, 0, 0.08);
}

.reward-row:has(.beast-loot-forced) {
    outline-style: dashed;
}
</style>
