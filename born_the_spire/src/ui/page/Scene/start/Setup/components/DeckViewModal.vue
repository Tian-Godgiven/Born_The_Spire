<template>
    <div class="deck-modal-overlay" @click.self="close">
        <div class="deck-modal">
            <div class="modal-header">
                <h2>卡组 <span class="deck-count">共 {{ totalCards }} 张卡牌</span></h2>
            </div>

            <div class="modal-content">
                <div class="card-grid">
                    <CardDisplay
                        v-for="card in cards"
                        :key="card.__id"
                        :card="card"
                    />
                </div>

                <div v-if="cards.length === 0" class="empty-state">
                    暂无卡牌
                </div>
            </div>

            <button class="close-btn" @click="close">×</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import CardDisplay from '@/ui/components/object/CardDisplay.vue'

const props = defineProps<{
    cards: Card[]
}>()

const emit = defineEmits<{
    close: []
}>()

const totalCards = computed(() => props.cards.length)

function close() {
    emit('close')
}
</script>

<style scoped lang="scss">
.deck-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.deck-modal {
    position: relative;
    background: transparent;
    width: 900px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    padding: 20px;

    h2 {
        margin: 0;
        font-size: 24px;
        color: white;

        .deck-count {
            font-size: 16px;
            font-weight: normal;
            margin-left: 10px;
            opacity: 0.8;
        }
    }
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border: 2px solid #000;
    background: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: rgba(255, 255, 255, 0.9);
    }
}

.modal-content {
    padding: 0 20px 20px;
    overflow-y: auto;
    flex: 1;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(5, 130px);
    gap: 20px;
    justify-content: center;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #fff;
    font-size: 16px;
}
</style>
