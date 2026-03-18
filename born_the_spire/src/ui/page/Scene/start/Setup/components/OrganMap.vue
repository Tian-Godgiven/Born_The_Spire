<template>
    <div class="organ-map">
        <div class="organ-header">
            <div class="section-label">选择初始器官</div>
            <div class="budget-display">
                <span>费用: {{ selectedCost }} / {{ budgetMax }}</span>
                <span v-if="selectedCost > budgetMax" class="budget-warning">超出上限!</span>
            </div>
        </div>

        <!-- 器官网格 -->
        <div class="organ-grid">
            <HoverShow
                v-for="organ in organs"
                :key="organ.key"
                hover-position="left"
                :max-width="270"
                :wait-time="50"
            >
                <div
                    class="organ-item"
                    :class="{
                        'selected': modelValue.includes(organ.key),
                        'mastered': isMastered(organ.key),
                        'disabled': !canSelect(organ),
                        'locked': organ.key === HEART_KEY,
                        'unlocked': isUnlocked(organ.key)
                    }"
                    @click="toggleOrgan(organ)"
                    @contextmenu.prevent="showOrganDetailModal(organ)"
                >
                    <div class="organ-name">{{ isUnlocked(organ.key) ? organ.label : '???' }}</div>
                    <div class="organ-part" v-if="isUnlocked(organ.key) && organ.part">{{ getPartLabel(organ.part) }}</div>
                    <div class="organ-cost" v-if="isUnlocked(organ.key)">{{ getOrganCost(organ) }}</div>
                    <div v-if="isMastered(organ.key)" class="mastery-badge">精通</div>
                    <div v-if="organ.key === HEART_KEY" class="lock-badge">🔒</div>
                </div>

                <!-- Hover 显示的器官详情 -->
                <template #hover>
                    <OrganPopup :organ="organ" />
                </template>
            </HoverShow>
        </div>

        <!-- 器官详情弹窗 -->
        <OrganDetail
            v-if="selectedOrganForDetail"
            :organ="selectedOrganForDetail"
            :visible="showOrganDetail"
            @close="closeOrganDetail"
        />
    </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import {
    getOrganMasteryLevel,
    ORGAN_RARITY_COST,
    type MetaProgressSave
} from '@/core/persistence/metaProgress'
import { getPartLabel } from '@/static/list/target/organPart'
import OrganDetail from '@/ui/components/interaction/OrganDetail.vue'
import HoverShow from '@/ui/components/global/HoverShow.vue'
import OrganPopup from '@/ui/components/object/OrganPopup.vue'

const HEART_KEY = 'original_organ_00001'

// ========== Props & Emits ==========
interface Props {
    modelValue: string[]
    organs: Organ[]
    metaProgress: MetaProgressSave
    ascensionLevel: number
    budgetMax: number
    selectedCost: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:modelValue': [value: string[]]
}>()

// ========== 状态 ==========
const selectedOrganForDetail = ref<Organ | null>(null)
const showOrganDetail = ref(false)

// ========== 方法 ==========
function isUnlocked(organKey: string): boolean {
    return !!props.metaProgress.unlockedOrgans[organKey]
}

function getOrganCost(organ: Organ): number {
    return ORGAN_RARITY_COST[organ.rarity] || 1
}

function canSelect(organ: Organ): boolean {
    // 未解锁的器官不可选择
    if (!isUnlocked(organ.key)) return false

    if (props.modelValue.includes(organ.key)) return true
    const cost = getOrganCost(organ)
    return props.selectedCost + cost <= props.budgetMax
}

function toggleOrgan(organ: Organ) {
    // 未解锁的器官不可选择
    if (!isUnlocked(organ.key)) return

    const newValue = [...props.modelValue]
    const index = newValue.indexOf(organ.key)

    // 心脏不可取消
    if (organ.key === HEART_KEY && index !== -1) {
        return
    }

    if (index !== -1) {
        newValue.splice(index, 1)
    } else if (canSelect(organ)) {
        newValue.push(organ.key)
    }
    emit('update:modelValue', newValue)
}

function isMastered(organKey: string): boolean {
    const masteryLevel = getOrganMasteryLevel(props.metaProgress, organKey)
    return masteryLevel >= props.ascensionLevel
}

function showOrganDetailModal(organ: Organ) {
    selectedOrganForDetail.value = organ
    showOrganDetail.value = true
}

function closeOrganDetail() {
    showOrganDetail.value = false
    selectedOrganForDetail.value = null
}
</script>

<style scoped lang='scss'>
.organ-map {
    display: flex;
    flex-direction: column;
    padding: 15px;
    border: 2px solid black;
    height: 100%;

    .organ-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        .budget-display {
            font-size: 16px;

            .budget-warning {
                color: #c00;
                margin-left: 10px;
            }
        }
    }

    // 器官网格
    .organ-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
        overflow-y: auto;
    }

    .organ-item {
        border: 2px solid #000;
        padding: 15px;
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80px;

        &:hover:not(.disabled):not(.locked) {
            background: rgba(0, 0, 0, 0.05);
        }

        &.selected {
            background: rgba(0, 100, 0, 0.1);
            border-color: #060;
        }

        &.mastered {
            border-color: #c80;
        }

        &.disabled:not(.selected) {
            opacity: 0.4;
            cursor: not-allowed;
        }

        &.locked {
            background: rgba(0, 0, 0, 0.05);
            cursor: default;

            &.selected {
                background: rgba(0, 100, 0, 0.15);
            }
        }

        &:not(.unlocked) {
            opacity: 0.3;
            cursor: not-allowed;
            background: rgba(0, 0, 0, 0.02);
        }

        .organ-name {
            font-size: 14px;
            text-align: center;
        }

        .organ-part {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }

        .organ-cost {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }

        .mastery-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            background: #c80;
            color: #fff;
            font-size: 10px;
            padding: 2px 4px;
        }

        .lock-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            font-size: 12px;
        }
    }
}
</style>
