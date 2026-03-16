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
            <PlayerPreview
                :player="previewPlayer"
                @remove-organ="removeOrgan"
            />
        </div>

        <OrganMap
            v-model="selectedOrgans"
            :organs="unlockedOrgans"
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
</div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted, watch } from 'vue'
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
import { reactive } from 'vue'
import SeedDialog from '../SeedDialog.vue'
import OrganMap from './components/OrganMap.vue'
import PlayerPreview from './components/PlayerPreview.vue'

const HEART_KEY = 'original_organ_00001'

const router = useRouter()

// ========== 状态 ==========
const seed = ref('')
const ascensionLevel = ref(0)
const showSeedDialog = ref(false)
const selectedOrgans = ref<string[]>([HEART_KEY]) // 默认包含心脏
const metaProgress = ref<MetaProgressSave>(loadMetaProgress())

// 预览 Player - 立即创建
const previewPlayer = reactive(createPreviewPlayer()) as unknown as Player

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
        const organ = getOrganByKey(key)
        if (!organ) return total
        return total + (ORGAN_RARITY_COST[organ.rarity] || 1)
    }, 0)
})

const canStart = computed(() => {
    return selectedCost.value <= budgetMax.value && selectedOrgans.value.length > 0
})

const unlockedOrgans = computed(() => {
    const organList = getLazyModule<any[]>('organList')
    const unlockedKeys = Object.keys(metaProgress.value.unlockedOrgans)

    return unlockedKeys.map(key => {
        const organData = organList.find((o: any) => o.key === key)
        if (!organData) return null
        return new Organ(organData)
    }).filter((o): o is Organ => o !== null)
})

// ========== 预览 Player 管理 ==========
function createPreviewPlayer(): Player {
    const map: PlayerMap = {
        label: "预览角色",
        key: "preview_player",
        status: {
            "max-health": 50,
            "max-energy": 3,
            "max-potion": 3,
            "draw-per-turn": 5,
        },
        current: ["health", "energy", "isAlive"],
        trigger: [],
        potion: { now: [] },
        organ: [],
        card: [],
    }
    return new Player(map)
}

async function syncOrgansToPlayer() {
    const organModifier = getOrganModifier(previewPlayer)
    const currentOrgans = organModifier.getOrgans()
    const currentKeys = currentOrgans.map(o => o.key)

    // 移除不在选中列表的器官（心脏除外）
    for (const organ of currentOrgans) {
        if (!selectedOrgans.value.includes(organ.key)) {
            organModifier.loseOrgan(organ, false)
        }
    }

    // 添加新选中的器官
    for (const organKey of selectedOrgans.value) {
        if (!currentKeys.includes(organKey)) {
            const organ = getOrganByKey(organKey)
            if (organ) {
                await organModifier.acquireOrgan(organ, previewPlayer)
            }
        }
    }
}

function removeOrgan(organKey: string) {
    // 心脏不可移除
    if (organKey === HEART_KEY) return
    const index = selectedOrgans.value.indexOf(organKey)
    if (index !== -1) {
        selectedOrgans.value.splice(index, 1)
    }
}

// 监听 selectedOrgans 变化
watch(selectedOrgans, () => {
    syncOrgansToPlayer()
}, { deep: true })

// ========== 方法 ==========
function prevAscension() {
    if (ascensionLevel.value > 0) ascensionLevel.value--
}

function nextAscension() {
    if (ascensionLevel.value < maxAscension.value) ascensionLevel.value++
}

function getOrganByKey(key: string): Organ | null {
    return unlockedOrgans.value.find(o => o.key === key) || null
}

function goBack() {
    router.replace('/')
}

async function startGame() {
    if (!canStart.value) return
    await startNewRun(seed.value || undefined, ascensionLevel.value, selectedOrgans.value)
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
    // 初始同步心脏器官
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
        gap: 15px;
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
