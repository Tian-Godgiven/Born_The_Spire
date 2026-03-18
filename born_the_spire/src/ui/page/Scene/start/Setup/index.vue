<template>
<div class="start-page">

    <!-- 顶部操作区 -->
    <div class="header">
        <div class="action-btn" @click="showSeedDialog = true">
            点击输入种子:<span class="seed-value">{{ seed || '随机' }}</span>
        </div>
        <button class="action-btn secondary" @click="exportSave">导出存档</button>
        <button class="action-btn secondary" @click="importSave">导入存档</button>
    </div>

    <!-- 中间 -->
     <div class="center">
        <div class="left-panel">
            <Chara v-if="previewPlayer" :target="previewPlayer" side='right' :key="previewPlayer.__id"></Chara>
            <button class="deck-btn" @click="showDeckModal = true">查看卡组</button>
        </div>

        <OrganMap
            v-model="selectedOrgans"
            :organs="displayOrgans"
            :meta-progress="metaProgress"
            :ascension-level="ascensionLevel"
            :budget-max="budgetMax"
            :selected-cost="selectedCost"
        />
     </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
        <button class="action-btn secondary" @click="goBack">返回</button>
        <div class="ascension-section">
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
        <button class="action-btn primary" @click="startGame" :disabled="!canStart">
            开始游戏
        </button>
    </div>

    <SeedDialog
        v-if="showSeedDialog"
        v-model:seed="seed"
        @close="showSeedDialog = false"
    />

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
import {
    loadMetaProgress,
    getInitialOrganBudget,
    copySaveToClipboard,
    importSaveFromClipboard,
    ORGAN_RARITY_COST,
    type MetaProgressSave
} from '@/core/persistence/metaProgress'
import { getAscensionConfig, getMaxAscensionLevel } from '@/static/list/system/ascensionList'
import { getLazyModule } from '@/core/utils/lazyLoader'
import { Organ } from '@/core/objects/target/Organ'
import { Player, type PlayerMap } from '@/core/objects/target/Player'
import { getOrganModifier } from '@/core/objects/system/modifier/OrganModifier'
import SeedDialog from '../SeedDialog.vue'
import OrganMap from './components/OrganMap.vue'
import Chara from '@/ui/components/object/Target/Chara/Chara.vue'
import DeckViewModal from './components/DeckViewModal.vue'
import { getCardModifier } from '@/core/objects/system/modifier/CardModifier'

const HEART_KEY = 'original_organ_00001'

const router = useRouter()

// ========== 状态 ==========
const seed = ref('')
const ascensionLevel = ref(0)
const showSeedDialog = ref(false)
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
    // 只在需要显示时创建 Organ 实例
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

    const map: PlayerMap = {
        label: "你",
        key: "you",
        status: {
            "max-health": 50,
            "max-energy": 3,
            "max-potion": 3,
            "draw-per-turn": 5,
        },
        current: ["health", "energy", "isAlive"],
        trigger: [],
        potion: { now: [] },
        organ: [HEART_KEY],  // 创建时就包含心脏
        card: [
            "original_card_00001",  // 打击 x5
            "original_card_00001",
            "original_card_00001",
            "original_card_00001",
            "original_card_00001",
            "original_card_00014",  // 防御 x5
            "original_card_00014",
            "original_card_00014",
            "original_card_00014",
            "original_card_00014",
        ],
    }

    const player = new Player(map)

    // 等待 Current 和 Organ 初始化完成
    await new Promise(resolve => setTimeout(resolve, 300))

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
                const organ = new Organ(organData)
                await organModifier.acquireOrgan(organ, previewPlayer.value, true)  // 跳过确认弹窗
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
    if (!canStart.value || !previewPlayer.value) return
    // 使用预创建的 Player 开始游戏（已包含所有选中的器官）
    await startNewRun(seed.value || undefined, ascensionLevel.value, undefined, previewPlayer.value)
}

async function exportSave() {
    const success = await copySaveToClipboard(metaProgress.value)
    if (success) alert('存档已复制到剪贴板')
}

async function importSave() {
    const success = await importSaveFromClipboard()
    if (success) {
        metaProgress.value = loadMetaProgress()
        alert('存档导入成功')
    }
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
    padding: 40px;
    gap: 40px;
    box-sizing: border-box;
}

.header{
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.center{
    display: flex;
    gap: 10px;
    >*{ flex-grow: 1; }
    .left-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;

        .deck-btn {
            padding: 10px 20px;
            font-size: 16px;
            border: 2px solid #000;
            background: #fff;
            cursor: pointer;

            &:hover {
                background: rgba(0, 0, 0, 0.05);
            }
        }
    }
}

.bottom-actions {
    position: absolute;
    bottom: 40px;
    width: calc(100% - 100px);
    display: flex;
    align-items: center;
    gap: 20px;
    >:nth-child(2){ flex: 1; }
}

.ascension-section {
    display: flex;
    flex-direction: column;
    align-items: center;

    .section-label {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
    }

    .ascension-control {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        margin-bottom: 10px;
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
    height: fit-content;
    padding: 5px 20px;
    font-size: 16px;
    border: 2px solid #000;
    cursor: pointer;
    background: #fff;

    &:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &.primary {
        background: #333;
        color: #fff;
        &:hover:not(:disabled) { background: #444; }
    }
}
</style>
