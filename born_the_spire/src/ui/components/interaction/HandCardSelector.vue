<template>
<div v-if="active" class="hand-card-selector">
    <!-- 遮罩层 -->
    <div class="mask" v-show="!maskHidden"></div>

    <!-- 中间选中区域 -->
    <div class="selection-area" v-show="!maskHidden">
        <div class="title">{{ config.title }}</div>
        <div class="selection-body">
            <!-- 左侧：眼睛按钮 -->
            <div class="side-btn left-side">
                <button class="btn eye-btn" @click="toggleMask">👁</button>
            </div>

            <!-- 中间：已选卡牌 -->
            <div class="selected-cards">
                <div
                    v-for="card in selectedCards"
                    :key="card.__id"
                    class="selected-card-wrapper"
                    @click="toggleCardSelection(card)"
                >
                    <CardVue :card="card as any" />
                </div>
            </div>

            <!-- 右侧：确认/取消按钮 -->
            <div class="side-btn right-side">
                <button
                    v-if="canConfirmSelection"
                    class="btn confirm-btn"
                    @click="confirmSelection"
                >确认</button>
                <button
                    v-if="config.cancelable"
                    class="btn cancel-btn"
                    @click="cancelSelection"
                >取消</button>
            </div>
        </div>
    </div>

    <!-- 遮罩隐藏时的恢复按钮 -->
    <button
        v-if="maskHidden"
        class="btn eye-btn floating-eye"
        @click="toggleMask"
    >👁</button>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CardVue from '@/ui/components/object/Card.vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import {
    handCardSelectorActive,
    handCardSelectorConfig,
    handCardSelectorSelectedCards,
    handCardSelectorMaskHidden,
    canConfirm,
    toggleCardSelection,
    confirmSelection,
    cancelSelection,
    toggleMask
} from '@/ui/hooks/interaction/handCardSelector'

const active = handCardSelectorActive
const config = handCardSelectorConfig
const selectedCards = handCardSelectorSelectedCards
const maskHidden = handCardSelectorMaskHidden
const canConfirmSelection = canConfirm
</script>

<style scoped lang="scss">
.hand-card-selector {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
    pointer-events: none;
}

.mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: auto;
}

.selection-area {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    z-index: 100;
    pointer-events: none;

    .title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 20px;
        border: 2px solid black;
    }

    .selection-body {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
    }

    .side-btn {
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
        flex-shrink: 0;
    }

    .selected-cards {
        display: flex;
        gap: 12px;
        min-height: 200px;
        align-items: center;
        justify-content: center;
        flex: 1;

        .selected-card-wrapper {
            pointer-events: auto;
            cursor: pointer;
            transition: transform 0.15s;

            &:hover {
                transform: translateY(-8px);
            }
        }
    }
}

.btn {
    padding: 8px 20px;
    border: 2px solid black;
    background: white;
    font-size: 14px;
    cursor: pointer;
    font-weight: bold;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.confirm-btn {
    padding: 12px 28px;
    font-size: 16px;
    background: #f0f0f0;
}

.eye-btn {
    padding: 8px 12px;
}

.floating-eye {
    position: absolute;
    bottom: 320px;
    right: 40px;
    z-index: 100;
    pointer-events: auto;
}
</style>
