<template>
    <div class="player-preview">
        <div class="section-label">角色预览</div>

        <!-- 属性显示 -->
        <div class="stats-section">
            <div class="stat-item">
                <span class="stat-label">生命:</span>
                <span class="stat-value">{{ maxHealth }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">能量:</span>
                <span class="stat-value">{{ maxEnergy }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">抽牌:</span>
                <span class="stat-value">{{ drawCount }}</span>
            </div>
        </div>

        <!-- 器官列表 -->
        <div v-if="organs.length > 0" class="organs-section">
            <div class="subsection-label">已装备器官</div>
            <div class="organ-list">
                <div
                    v-for="organ in organs"
                    :key="organ.key"
                    class="organ-chip"
                    :class="{ 'cannot-remove': !canRemove(organ.key) }"
                    @click="canRemove(organ.key) && $emit('remove-organ', organ.key)"
                >
                    {{ organ.label }}
                    <span v-if="canRemove(organ.key)" class="remove-hint">×</span>
                    <span v-else class="lock-hint">🔒</span>
                </div>
            </div>
        </div>

        <!-- 卡牌数量 -->
        <div class="cards-section">
            <div class="stat-item">
                <span class="stat-label">卡组:</span>
                <span class="stat-value">{{ cardCount }} 张</span>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import type { Player } from '@/core/objects/target/Player'
import { getStatusValue } from '@/core/objects/system/status/Status'
import { getOrganModifier } from '@/core/objects/system/modifier/OrganModifier'
import { getCardModifier } from '@/core/objects/system/modifier/CardModifier'

const HEART_KEY = 'original_organ_00001'

interface Props {
    player: Player
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'remove-organ': [organKey: string]
}>()

// 计算属性
const maxHealth = computed(() => getStatusValue(props.player, 'max-health'))
const maxEnergy = computed(() => getStatusValue(props.player, 'max-energy'))
const drawCount = computed(() => getStatusValue(props.player, 'draw-per-turn'))

const organs = computed(() => {
    const organModifier = getOrganModifier(props.player)
    return organModifier.getOrgans()
})

const cardCount = computed(() => {
    const cardModifier = getCardModifier(props.player)
    return cardModifier.getAllCards().length
})

function canRemove(organKey: string): boolean {
    return organKey !== HEART_KEY
}
</script>

<style scoped lang='scss'>
.player-preview {
    border: 2px solid #000;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.section-label {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.subsection-label {
    font-size: 14px;
    font-weight: bold;
    color: #666;
    margin-bottom: 8px;
}

.stats-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    font-size: 14px;

    .stat-label {
        color: #666;
    }

    .stat-value {
        font-weight: bold;
    }
}

.organs-section {
    .organ-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .organ-chip {
        border: 2px solid #060;
        padding: 5px 10px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &:not(.cannot-remove) {
            cursor: pointer;
            &:hover {
                background: rgba(200, 0, 0, 0.1);
                border-color: #c00;
                .remove-hint { opacity: 1; }
            }
        }

        &.cannot-remove {
            background: rgba(0, 0, 0, 0.05);
            color: #666;
        }

        .remove-hint {
            opacity: 0.3;
            font-size: 18px;
            font-weight: bold;
            color: #c00;
            transition: opacity 0.2s;
        }

        .lock-hint {
            font-size: 14px;
        }
    }
}

.cards-section {
    border-top: 1px solid #ccc;
    padding-top: 10px;
}
</style>
