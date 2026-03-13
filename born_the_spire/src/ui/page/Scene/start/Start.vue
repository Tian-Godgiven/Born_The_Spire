<template>
<div class="start-page">
    <!-- 左侧区域 -->
    <div class="left-panel">
        <!-- 种子输入 -->
        <div class="seed-section">
            <div class="section-label">种子</div>
            <div class="seed-display" @click="showSeedDialog = true">
                <span class="seed-value">{{ seed || '随机' }}</span>
                <span class="seed-edit">点击编辑</span>
            </div>
        </div>

        <!-- 进阶选择 -->
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
    </div>

    <!-- 中间/右侧区域：器官选择 -->
    <div class="right-panel">
        <div class="organ-header">
            <div class="section-label">选择初始器官</div>
            <div class="budget-display">
                <span>费用: {{ selectedCost }} / {{ budgetMax }}</span>
                <span v-if="selectedCost > budgetMax" class="budget-warning">超出上限!</span>
            </div>
        </div>

        <!-- 器官网格 -->
        <div class="organ-grid">
            <div
                v-for="organ in unlockedOrgans"
                :key="organ.key"
                class="organ-item"
                :class="{
                    'selected': selectedOrgans.includes(organ.key),
                    'mastered': isMastered(organ.key),
                    'disabled': !canSelect(organ)
                }"
                @click="toggleOrgan(organ)"
                @contextmenu.prevent="showOrganDetailModal(organ)"
            >
                <div class="organ-name">{{ organ.label }}</div>
                <div class="organ-cost">{{ getOrganCost(organ) }}</div>
                <div v-if="isMastered(organ.key)" class="mastery-badge">精通</div>
            </div>
        </div>

        <!-- 已选器官预览 -->
        <div v-if="selectedOrgans.length > 0" class="selected-preview">
            <div class="section-label">已选择</div>
            <div class="selected-list">
                <div
                    v-for="key in selectedOrgans"
                    :key="key"
                    class="selected-item"
                >
                    {{ getOrganName(key) }}
                </div>
            </div>
        </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
        <button class="action-btn secondary" @click="goBack">返回</button>
        <button class="action-btn secondary" @click="exportSave">导出存档</button>
        <button class="action-btn secondary" @click="importSave">导入存档</button>
        <button
            class="action-btn primary"
            @click="startGame"
            :disabled="!canStart"
        >
            开始游戏
        </button>
    </div>

    <!-- 种子输入弹窗 -->
    <SeedDialog
        v-if="showSeedDialog"
        v-model:seed="seed"
        @close="showSeedDialog = false"
    />

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { startNewRun } from '@/core/objects/game/run'
import {
    loadMetaProgress,
    saveMetaProgress,
    getInitialOrganBudget,
    getOrganMasteryLevel,
    exportSaveToJson,
    importSaveFromJson,
    copySaveToClipboard,
    importSaveFromClipboard,
    ORGAN_RARITY_COST,
    type MetaProgressSave
} from '@/core/persistence/metaProgress'
import { getCachedMetaProgress } from '@/core/hooks/organUnlock'
import { getAscensionConfig, getMaxAscensionLevel } from '@/static/list/system/ascensionList'
import { getLazyModule } from '@/core/utils/lazyLoader'
import { Organ } from '@/core/objects/target/Organ'
import SeedDialog from './SeedDialog.vue'
import OrganDetail from '@/ui/components/interaction/OrganDetail.vue'

const router = useRouter()

// ========== 状态 ==========
const seed = ref('')
const ascensionLevel = ref(0)
const showSeedDialog = ref(false)
const selectedOrgans = ref<string[]>([])
const metaProgress = ref<MetaProgressSave>(loadMetaProgress())
const selectedOrganForDetail = ref<Organ | null>(null)
const showOrganDetail = ref(false)

// ========== 计算属性 ==========
const maxAscension = computed(() => getMaxAscensionLevel())

const ascensionTitle = computed(() => {
    if (ascensionLevel.value === 0) return '普通'
    return `进阶 ${ascensionLevel.value}`
})

const ascensionDesc = computed(() => {
    const config = getAscensionConfig(ascensionLevel.value)
    if (!config) return ''
    // 根据进阶等级生成描述
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

// 获取已解锁的器官列表
const unlockedOrgans = computed(() => {
    const organList = getLazyModule<any[]>('organList')
    const unlockedKeys = Object.keys(metaProgress.value.unlockedOrgans)

    return unlockedKeys.map(key => {
        const organData = organList.find((o: any) => o.key === key)
        if (!organData) {
            console.warn(`[Start] 未找到器官数据: ${key}`)
            return null
        }
        return new Organ(organData)
    }).filter((o): o is Organ => o !== null)
})

// ========== 方法 ==========
function prevAscension() {
    if (ascensionLevel.value > 0) {
        ascensionLevel.value--
    }
}

function nextAscension() {
    if (ascensionLevel.value < maxAscension.value) {
        ascensionLevel.value++
    }
}

function getOrganCost(organ: Organ): number {
    return ORGAN_RARITY_COST[organ.rarity] || 1
}

function canSelect(organ: Organ): boolean {
    if (selectedOrgans.value.includes(organ.key)) return true
    const cost = getOrganCost(organ)
    return selectedCost.value + cost <= budgetMax.value
}

function toggleOrgan(organ: Organ) {
    // 如果已经选中，取消选择
    const index = selectedOrgans.value.indexOf(organ.key)
    if (index !== -1) {
        selectedOrgans.value.splice(index, 1)
        return
    }

    // 检查是否可以选中
    if (!canSelect(organ)) return

    selectedOrgans.value.push(organ.key)
}

function isMastered(organKey: string): boolean {
    const masteryLevel = getOrganMasteryLevel(metaProgress.value, organKey)
    return masteryLevel >= ascensionLevel.value
}

function showOrganDetailModal(organ: Organ) {
    selectedOrganForDetail.value = organ
    showOrganDetail.value = true
}

function closeOrganDetail() {
    showOrganDetail.value = false
    selectedOrganForDetail.value = null
}

function getOrganByKey(key: string): Organ | null {
    return unlockedOrgans.value.find(o => o.key === key) || null
}

function getOrganName(key: string): string {
    const organ = getOrganByKey(key)
    return organ?.label || key
}

function goBack() {
    router.replace('/')
}

async function startGame() {
    if (!canStart.value) return

    // 保存选中的初始器官到游戏运行数据
    await startNewRun(seed.value || undefined, ascensionLevel.value, selectedOrgans.value)
}

async function exportSave() {
    const success = await copySaveToClipboard(metaProgress.value)
    if (success) {
        alert('存档已复制到剪贴板')
    }
}

async function importSave() {
    const success = await importSaveFromClipboard()
    if (success) {
        metaProgress.value = loadMetaProgress()
        alert('存档导入成功')
    }
}

// 初始化
onMounted(() => {
    // 加载保存的数据
    metaProgress.value = loadMetaProgress()
})
</script>

<style scoped lang='scss'>
.start-page {
    width: 100%;
    height: 100%;
    display: flex;
    padding: 40px;
    gap: 40px;
    box-sizing: border-box;
}

// 左侧面板
.left-panel {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.section-label {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
}

// 种子区域
.seed-section {
    .seed-display {
        border: 2px solid #000;
        padding: 15px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .seed-value {
            font-size: 16px;
        }

        .seed-edit {
            font-size: 12px;
            color: #666;
        }
    }
}

// 进阶区域
.ascension-section {
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

        &:hover:not(:disabled) {
            background: rgba(0, 0, 0, 0.05);
        }

        &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    }

    .ascension-display {
        text-align: center;

        .ascension-level {
            font-size: 32px;
            font-weight: bold;
        }

        .ascension-title {
            font-size: 14px;
            color: #666;
            display: block;
        }
    }

    .ascension-desc {
        font-size: 12px;
        color: #666;
        text-align: center;
        padding: 0 10px;
    }
}

// 右侧面板
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
}

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
    border: 2px solid #000;
    padding: 15px;
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

    &:hover:not(.disabled) {
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

    .organ-name {
        font-size: 14px;
        text-align: center;
    }

    .organ-cost {
        font-size: 12px;
        color: #666;
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
}

// 已选预览
.selected-preview {
    margin-top: 15px;
    border: 2px solid #000;
    padding: 15px;

    .selected-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .selected-item {
        border: 2px solid #060;
        padding: 5px 10px;
        font-size: 14px;
    }
}

// 底部按钮
.bottom-actions {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.action-btn {
    padding: 15px 40px;
    font-size: 18px;
    border: 2px solid #000;
    cursor: pointer;
    background: #fff;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    &.primary {
        background: #333;
        color: #fff;

        &:hover:not(:disabled) {
            background: #444;
        }
    }
}
</style>
