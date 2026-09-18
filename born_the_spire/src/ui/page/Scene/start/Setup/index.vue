<template>
<div class="start-page">

    <!-- 中间：左边选器官（hover 往右开），右边角色预览 -->
     <div class="center">
        <OrganMap
            v-model="selectedOrgans"
            :organs="displayOrgans"
            :meta-progress="metaProgress"
            :ascension-level="ascensionLevel"
            :budget-max="budgetMax"
            :selected-cost="selectedCost"
        />

        <div class="preview-panel">
            <div class="chara-container">
                <Chara v-if="previewPlayer" :target="previewPlayer" side='right' :key="previewPlayer.__id"></Chara>
            </div>
            <Button class="deck-btn" :click="() => showDeckModal = true" label="卡组" />
        </div>
     </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
        <Button class="action-btn" :click="goBack" label="返回" />
        <div v-if="ascensionUiEnabled" class="ascension-section">
            <div class="section-label">进阶</div>
            <div class="ascension-control">
                <button class="arrow-btn" @click="prevAscension" :disabled="ascensionLevel <= 0">◀</button>
                <div class="ascension-display">
                    <span class="ascension-level">{{ ascensionLevel }}</span>
                    <span class="ascension-title">{{ ascensionTitle }}</span>
                </div>
                <button class="arrow-btn" @click="nextAscension" :disabled="ascensionLevel >= maxAscension">▶</button>
            </div>
            <div class="ascension-desc">{{ ascensionDesc }}</div>
        </div>
        <Button class="action-btn primary" invert :click="startGame" :disabled="!canStart" label="开始游戏" />
    </div>

    <DeckViewModal
        v-if="showDeckModal"
        :cards="playerCards"
        @close="showDeckModal = false"
    />

</div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted, watch, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { startNewRun } from '@/core/objects/game/run'
import { requestGameFullscreen } from '@/ui/hooks/global/layoutMode'
import {
    loadMetaProgress,
    getInitialOrganBudget,
    ORGAN_RARITY_COST,
    type MetaProgressSave
} from '@/core/persistence/metaProgress'
import { getAscensionConfig, getMaxAscensionLevel, ASCENSION_UI_ENABLED } from '@/static/list/system/ascensionList'
import { getLazyModule } from '@/core/utils/lazyLoader'
import { Organ } from '@/core/objects/target/Organ'
import { Player, type PlayerMap } from '@/core/objects/target/Player'
import { getOrganModifier } from '@/core/objects/system/modifier/OrganModifier'
import { createPlayer } from '@/core/factories'
import Button from '@/ui/components/global/Button.vue'
import OrganMap from './components/OrganMap.vue'
import Chara from '@/ui/components/object/Target/Chara/Chara.vue'
import DeckViewModal from '@/ui/components/interaction/DeckViewModal.vue'
import { getCardModifier } from '@/core/objects/system/modifier/CardModifier'
import { playerList } from '@/static/list/target/playerList'

const HEART_KEY = 'original_organ_00001'

const router = useRouter()

// ========== 状态 ==========
const ascensionUiEnabled = ASCENSION_UI_ENABLED
const ascensionLevel = ref(0)
const showDeckModal = ref(false)
const selectedOrgans = ref<string[]>([HEART_KEY]) // 默认包含心脏
const metaProgress = ref<MetaProgressSave>(loadMetaProgress())

// 预览 Player - 用于显示属性
const previewPlayer = shallowRef<Player | null>(null)

// ========== 计算属性 ==========
const maxAscension = computed(() => getMaxAscensionLevel())

const ascensionTitle = computed(() => {
    if (ascensionLevel.value === 0) return '普通'
    return `进阶 ${ascensionLevel.value}`
})

const ascensionDesc = computed(() => {
    const config = getAscensionConfig(ascensionLevel.value)
    if (!config) return ''
    const mods: string[] = []
    if (ascensionLevel.value >= 1) mods.push('敌人生命+10%')
    if (ascensionLevel.value >= 3) mods.push('敌人伤害+10%')
    if (ascensionLevel.value >= 5) mods.push('精英生命+25%')
    if (ascensionLevel.value >= 7) mods.push('精英伤害+25%')
    if (ascensionLevel.value >= 10) mods.push('Boss生命+25%')
    return mods.join('，') || '无额外难度'
})

const budgetMax = computed(() => getInitialOrganBudget(metaProgress.value))

const selectedCost = computed(() => {
    return selectedOrgans.value.reduce((total, key) => {
        const organData = allOrganData.value.find((o: any) => o.key === key)
        if (!organData) return total
        return total + (ORGAN_RARITY_COST[organData.rarity] || 1)
    }, 0)
})

const canStart = computed(() => {
    return selectedCost.value <= budgetMax.value && selectedOrgans.value.length > 0
})

const allOrganData = computed(() => {
    const organList = getLazyModule<any[]>('organList')
    return organList
})

const displayOrgans = computed(() => {
    // 只用于 UI 显示，不需要完整初始化（Organ 构造函数是同步的）
    return allOrganData.value.map((organData: any) => {
        return new Organ(organData)
    })
})

const playerCards = computed(() => {
    if (!previewPlayer.value) return []
    const cardModifier = getCardModifier(previewPlayer.value)
    return cardModifier.getAllCards()
})

// ========== 预览 Player 管理 ==========
async function createPreviewPlayer(): Promise<Player> {
    // 使用标准 player 配置作为基础
    const defaultPlayerMap = playerList["default"]
    const player = await createPlayer(defaultPlayerMap)

    return player
}

// 同步器官到 Player（通过事件系统）
async function syncOrgansToPlayer() {
    if (!previewPlayer.value) return

    const organModifier = getOrganModifier(previewPlayer.value)
    const currentOrgans = organModifier.getOrgans()
    const currentKeys = currentOrgans.map(o => o.key)

    // 移除不在选中列表的器官
    for (const organ of currentOrgans) {
        if (!selectedOrgans.value.includes(organ.key)) {
            organModifier.loseOrgan(organ, false)
        }
    }

    // 添加新选中的器官（通过事件系统）
    for (const organKey of selectedOrgans.value) {
        if (!currentKeys.includes(organKey)) {
            const organData = allOrganData.value.find((o: any) => o.key === organKey)
            if (organData) {
                const organ = getOrganByKey(organKey)
                if (organ) {
                    await organModifier.acquireOrgan(organ, previewPlayer.value, true)  // 跳过确认弹窗
                }
            }
        }
    }

    // 同步完成后，更新 selectedOrgans 以反映实际拥有的器官
    // 这样可以处理部位冲突导致的自动替换
    const finalOrgans = organModifier.getOrgans()
    const finalKeys = finalOrgans.map(o => o.key)

    // 如果实际器官列表和选中列表不一致，更新选中列表
    if (JSON.stringify(finalKeys.sort()) !== JSON.stringify([...selectedOrgans.value].sort())) {
        selectedOrgans.value = finalKeys
    }
}

// 监听器官选择变化，通过事件系统同步
watch(selectedOrgans, async () => {
    await syncOrgansToPlayer()
}, { deep: true })

// ========== 方法 ==========
function prevAscension() {
    if (ascensionLevel.value > 0) ascensionLevel.value--
}

function nextAscension() {
    if (ascensionLevel.value < maxAscension.value) ascensionLevel.value++
}

function getOrganByKey(key: string): Organ | null {
    return displayOrgans.value.find(o => o.key === key) || null
}

function goBack() {
    router.replace('/')
}

async function startGame() {
    if (!canStart.value || !previewPlayer.value) {
        return
    }

    requestGameFullscreen()
    await startNewRun(undefined, ascensionLevel.value, undefined, previewPlayer.value)
}

// 初始化
onMounted(async () => {
    metaProgress.value = loadMetaProgress()

    // 创建 Player（只创建一次）
    const player = await createPreviewPlayer()

    previewPlayer.value = player

    // 初始同步器官
    await syncOrgansToPlayer()
})
</script>

<style scoped lang='scss'>
.start-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--layout-setup-padding);
    gap: var(--layout-gap-lg);
    box-sizing: border-box;
}

.center{
    display: flex;
    align-items: var(--layout-setup-center-align);
    gap: var(--layout-gap-sm);
    flex-grow: 1;
    min-height: 0;
    >*{
        flex-grow: 1;
        min-width: 0;
        min-height: 0;
    }
    .preview-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        align-self: var(--layout-setup-preview-align-self);
        position: relative;
        flex-grow: var(--layout-setup-preview-grow);
        max-height: var(--layout-setup-preview-max-height);
        justify-content: flex-start;
        gap: var(--layout-gap-md);

        .chara-container {
            margin-top: var(--layout-setup-chara-margin-top);
            display: flex;
            align-items: center;
            gap: var(--layout-gap-md);
        }

        :deep(.deck-btn) {
            position: absolute;
            right: 0;
            top: 0;

            .game-btn-face {
                background: #fff;
            }
        }
    }
}

.bottom-actions {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--layout-gap-md);
}

.ascension-section {
    display: flex;
    flex-direction: column;
    align-items: center;

    .section-label {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: var(--layout-gap-sm);
        color: #333;
    }

    .ascension-control {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--layout-gap-md);
        margin-bottom: var(--layout-gap-sm);
    }

    .arrow-btn {
        width: 40px;
        height: 40px;
        border: 2px solid #000;
        background: #fff;
        cursor: pointer;
        font-size: 16px;

        &:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
        &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .ascension-display {
        text-align: center;
        .ascension-level { font-size: 32px; font-weight: bold; }
        .ascension-title { font-size: 14px; color: #666; display: block; }
    }

    .ascension-desc {
        font-size: 12px;
        color: #666;
        text-align: center;
        padding: 0 10px;
    }
}

.action-btn {
    font-size: 16px;

    &.game-btn {
        padding: 1px;
    }

    :deep(.game-btn-face) {
        padding: 5px 20px;
        line-height: normal;
    }

    &:not(.invert) :deep(.game-btn-face) {
        background: #fff;
    }
}

</style>
