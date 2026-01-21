<template>
    <div class="reward-container">
        <h2 class="reward-title">{{ title }}</h2>

        <div class="reward-list">
            <div
                v-for="reward in rewards"
                :key="reward.__key"
                class="reward-item"
                :class="{
                    'reward-available': reward.isAvailable(),
                    'reward-claimed': reward.isClaimed(),
                    'reward-locked': reward.isLocked()
                }"
                @click="handleRewardClick(reward)"
            >
                <!-- 自定义组件渲染 -->
                <component
                    v-if="reward.component"
                    :is="reward.component"
                    :reward="reward"
                />

                <!-- 默认渲染 -->
                <div v-else class="reward-default">
                    <div class="reward-icon">{{ reward.getDisplayIcon() }}</div>
                    <div class="reward-info">
                        <div class="reward-name">{{ reward.getDisplayTitle() }}</div>
                        <div class="reward-description">{{ reward.getDisplayDescription() }}</div>
                    </div>
                    <div v-if="reward.isClaimed()" class="reward-claimed-badge">✓</div>
                </div>
            </div>
        </div>

        <div v-if="showContinueButton" class="reward-actions">
            <button
                class="continue-button"
                :disabled="!canContinue"
                @click="handleContinue"
            >
                {{ continueButtonText }}
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { Reward } from '@/core/objects/reward/Reward'

const props = defineProps<{
    rewards: Reward[]                    // 奖励列表
    title?: string                       // 标题
    showContinueButton?: boolean         // 是否显示继续按钮
    continueButtonText?: string          // 继续按钮文本
    requireAllClaimed?: boolean          // 是否要求全部领取才能继续
}>()

const emit = defineEmits<{
    continue: []                         // 继续事件
    rewardClaimed: [reward: Reward]      // 奖励领取事件
}>()

/**
 * 处理奖励点击
 */
async function handleRewardClick(reward: Reward) {
    if (!reward.isAvailable()) {
        return
    }

    try {
        await reward.claim()
        emit('rewardClaimed', reward)
    } catch (error) {
        console.error('[RewardContainer] 领取奖励失败:', error)
    }
}

/**
 * 是否可以继续
 */
const canContinue = computed(() => {
    if (!props.requireAllClaimed) {
        return true
    }

    // 检查是否所有奖励都已领取
    return props.rewards.every(reward => reward.isClaimed() || reward.isLocked())
})

/**
 * 处理继续按钮点击
 */
function handleContinue() {
    if (canContinue.value) {
        emit('continue')
    }
}
</script>

<style scoped lang='scss'>
.reward-container {
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.reward-title {
    font-size: 2rem;
    text-align: center;
    margin: 0;
}

.reward-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.reward-item {
    border: 2px solid black;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &.reward-available:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.reward-claimed {
        opacity: 0.6;
        cursor: default;
    }

    &.reward-locked {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.reward-default {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    position: relative;
}

.reward-icon {
    font-size: 3rem;
    min-width: 4rem;
    text-align: center;
}

.reward-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.reward-name {
    font-size: 1.5rem;
    font-weight: bold;
}

.reward-description {
    font-size: 1rem;
    color: #666;
}

.reward-claimed-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    color: green;
}

.reward-actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.continue-button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: 2px solid black;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>
