<template>
<div class="blackstore-room">
    <!-- 标题 -->
    <div class="blackstore-header">
        <h1 class="blackstore-title">{{ storeTitle }}</h1>
        <p class="blackstore-desc">一个进行着可疑交易的窝点...</p>
    </div>

    <div class="blackstore-body">
        <!-- 左侧：金钱 + 出售 -->
        <div class="side-panel">
            <!-- 金钱信息 -->
            <div class="currency-box">
                <div class="currency-title">持有金钱</div>
                <div
                    v-for="[key, value] in allReserves"
                    :key="key"
                    class="currency-row"
                >
                    <span class="currency-label">{{ reserveLabel(key) }}</span>
                    <span class="currency-value">{{ value }}</span>
                </div>
            </div>

            <!-- 出售区域 -->
            <div class="sell-section">
                <div class="sell-title">出售</div>

                <div
                    v-if="allowSellOrgan"
                    class="sell-option"
                    @click="handleSellOrgan"
                >
                    <div class="sell-option-name">出售器官</div>
                    <div class="sell-option-desc">以购入价的 50~70% 出售</div>
                </div>

                <div
                    v-if="allowSellHealth"
                    class="sell-option"
                    @click="handleSellHealth"
                >
                    <div class="sell-option-name">出售生命值</div>
                    <div class="sell-option-desc">
                        永久降低最大生命
                        <span v-if="healthSoldCount > 0" class="depreciation-note">
                            (已贬值 {{ healthSoldCount }} 次)
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 右侧：商品区 -->
        <div class="store-panel">
            <!-- 上方：器官（横排一行） -->
            <div v-if="organItems.length > 0" class="store-category">
                <h2 class="section-title">器官</h2>
                <div class="items-row">
                    <div
                        v-for="item in organItems"
                        :key="item.id"
                        class="store-item"
                        :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                        @click="handlePurchase(item)"
                        @mouseenter="showItemTooltip(item, $event)"
                        @mouseleave="startHideTooltip"
                    >
                        <div class="item-name">{{ item.name }}</div>
                        <div v-if="item.rarity" class="item-rarity">{{ item.rarity }}</div>
                        <div class="item-price">{{ item.price }} 金</div>
                        <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                    </div>
                </div>
            </div>

            <!-- 下方：左卡牌 / 右遗物+药水 -->
            <div class="store-bottom">
                <!-- 下左：卡牌 -->
                <div v-if="cardItems.length > 0" class="store-category store-bottom-left">
                    <h2 class="section-title">卡牌</h2>
                    <div class="items-col">
                        <div
                            v-for="item in cardItems"
                            :key="item.id"
                            class="store-item"
                            :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                            @click="handlePurchase(item)"
                            @mouseenter="showItemTooltip(item, $event)"
                            @mouseleave="startHideTooltip"
                        >
                            <div class="item-name">{{ item.name }}</div>
                            <div class="item-price">{{ item.price }} 金</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                </div>

                <!-- 下右：遗物 + 药水 -->
                <div class="store-bottom-right">
                    <div v-if="relicItems.length > 0" class="store-category">
                        <h2 class="section-title">遗物</h2>
                        <div class="items-row">
                            <div
                                v-for="item in relicItems"
                                :key="item.id"
                                class="store-item"
                                :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                                @click="handlePurchase(item)"
                                @mouseenter="showItemTooltip(item, $event)"
                                @mouseleave="startHideTooltip"
                            >
                                <div class="item-name">{{ item.name }}</div>
                                <div class="item-price">{{ item.price }} 金</div>
                                <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                            </div>
                        </div>
                    </div>

                    <div v-if="potionItems.length > 0" class="store-category">
                        <h2 class="section-title">药水</h2>
                        <div class="items-row">
                            <div
                                v-for="item in potionItems"
                                :key="item.id"
                                class="store-item"
                                :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                                @click="handlePurchase(item)"
                                @mouseenter="showItemTooltip(item, $event)"
                                @mouseleave="startHideTooltip"
                            >
                                <div class="item-name">{{ item.name }}</div>
                                <div class="item-price">{{ item.price }} 金</div>
                                <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 商品详情悬浮框 -->
    <Teleport to="body">
        <div
            v-if="tooltipVisible && tooltipItem"
            ref="tooltipRef"
            class="store-tooltip"
            :style="tooltipStyle"
            @mouseenter="cancelHideTooltip"
            @mouseleave="startHideTooltip"
        >
            <!-- 器官详情 -->
            <OrganPopup
                v-if="tooltipItem.type === 'organ' && getPreview(tooltipItem.id)"
                :organ="getPreview(tooltipItem.id)"
            />
            <!-- 遗物详情：复用 Relic.vue 的 tooltip 结构 -->
            <div
                v-if="tooltipItem.type === 'relic' && getPreview(tooltipItem.id)"
                class="relic-tooltip"
            >
                <div class="tooltip-header">
                    <span class="relic-name">{{ getPreview(tooltipItem.id).label }}</span>
                    <span class="relic-rarity" v-if="getPreview(tooltipItem.id).rarity">
                        [{{ getRarityText(getPreview(tooltipItem.id).rarity) }}]
                    </span>
                </div>
                <div class="tooltip-body">
                    <div class="relic-description">
                        {{ getRelicDesc(tooltipItem.id) }}
                    </div>
                    <div
                        class="relic-abilities"
                        v-if="getPreview(tooltipItem.id).activeAbilities?.length"
                    >
                        <div class="abilities-title">主动能力：</div>
                        <div
                            v-for="(ability, index) in getPreview(tooltipItem.id).activeAbilities"
                            :key="index"
                            class="ability-item"
                        >
                            <div class="ability-label">{{ ability.label }}</div>
                            <div class="ability-desc">{{ getAbilityDesc(tooltipItem.id, ability) }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 卡牌详情 -->
            <Card
                v-if="tooltipItem.type === 'card' && getPreview(tooltipItem.id)"
                :card="getPreview(tooltipItem.id)"
            />
            <!-- 药水详情 -->
            <div
                v-if="tooltipItem.type === 'potion' && getPreview(tooltipItem.id)"
                class="potion-tooltip"
            >
                <div class="potion-tooltip-name">{{ getPreview(tooltipItem.id).label }}</div>
                <div class="potion-tooltip-desc">{{ getPotionDesc(tooltipItem.id) }}</div>
            </div>
        </div>
    </Teleport>

    <!-- 离开按钮 -->
    <LeaveButton @leave="handleLeave">离开黑市</LeaveButton>

    <!-- 出售器官弹窗 -->
    <div v-if="showSellOrganModal" class="modal-overlay" @click="closeSellOrganModal">
        <div class="modal-content" @click.stop>
            <h2 class="modal-title">选择要出售的器官</h2>
            <div class="organ-list">
                <div
                    v-for="info in sellableOrgans"
                    :key="info.organ.key"
                    class="organ-item"
                    @click="confirmSellOrgan(info.organ)"
                >
                    <div class="organ-name">{{ info.organ.label }}</div>
                    <div class="organ-sell-price">{{ info.sellPrice }} 金 ({{ info.discountPercent }})</div>
                </div>
                <div v-if="sellableOrgans.length === 0" class="empty-hint">没有可出售的器官</div>
            </div>
            <div class="modal-close" @click="closeSellOrganModal">取消</div>
        </div>
    </div>

    <!-- 出售生命值弹窗 -->
    <div v-if="showSellHealthModal" class="modal-overlay" @click="closeSellHealthModal">
        <div class="modal-content" @click.stop>
            <h2 class="modal-title">出售生命值</h2>
            <div class="health-info">
                <p>当前生命值: {{ playerCurrentHealth }} / {{ playerMaxHealth }}</p>
                <p class="warning-text">永久降低最大生命值</p>
            </div>
            <div class="health-options">
                <div
                    v-for="amount in healthAmountOptions"
                    :key="amount"
                    class="health-option"
                    :class="{ 'disabled': !canSellHealthAmount(amount) }"
                    @click="confirmSellHealth(amount)"
                >
                    <div class="health-amount">{{ amount }} 生命</div>
                    <div class="health-price">→ {{ getHealthSellPrice(amount) }} 金</div>
                </div>
            </div>
            <div class="modal-close" @click="closeSellHealthModal">取消</div>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { computed, ref, nextTick } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { BlackStoreRoom } from '@/core/objects/room/BlackStoreRoom'
import type { StoreItem } from '@/core/objects/room/BlackStoreRoom'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import type { Organ } from '@/core/objects/target/Organ'
import { newLog } from '@/ui/hooks/global/log'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'
import { goToNextStep } from '@/core/hooks/step'
import { getDescribe } from '@/ui/hooks/express/describe'
import LeaveButton from '@/ui/components/global/LeaveButton.vue'
import OrganPopup from '@/ui/components/object/OrganPopup.vue'
import Card from '@/ui/components/object/Card.vue'

// 金钱类型显示名映射
const RESERVE_LABELS: Record<string, string> = {
    gold: '金币',
}

function reserveLabel(key: string): string {
    return RESERVE_LABELS[key] ?? key
}

// 遗物稀有度显示
const RARITY_MAP: Record<string, string> = {
    common: '普通',
    uncommon: '稀有',
    rare: '史诗',
}

function getRarityText(rarity: string): string {
    return RARITY_MAP[rarity] || rarity
}

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof BlackStoreRoom) return room
    return null
})

const storeTitle = computed(() => currentRoom.value?.getDisplayName() || '黑市')

// 金钱
const allReserves = computed(() => {
    const reserveModifier = getReserveModifier(nowPlayer)
    return reserveModifier.getAllReserves()
})

// 商品
const allItems = computed(() => currentRoom.value?.getStoreItems() || [])
const organItems = computed(() => allItems.value.filter(i => i.type === 'organ'))
const relicItems = computed(() => allItems.value.filter(i => i.type === 'relic'))
const potionItems = computed(() => allItems.value.filter(i => i.type === 'potion'))
const cardItems = computed(() => allItems.value.filter(i => i.type === 'card'))

// 出售相关
const allowSellOrgan = computed(() => currentRoom.value?.allowSellOrgan ?? false)
const allowSellHealth = computed(() => currentRoom.value?.allowSellHealth ?? false)
const healthSoldCount = computed(() => currentRoom.value?.getHealthSoldCount() || 0)

// 可出售器官（带折扣信息）
const sellableOrgans = computed(() => currentRoom.value?.getSellableOrgans() || [])

// 玩家生命值
const playerCurrentHealth = computed(() => getCurrentValue(nowPlayer, 'health'))
const playerMaxHealth = computed(() => getStatusValue(nowPlayer, 'max-health'))

const healthAmountOptions = [5, 10, 15, 20]

// 弹窗状态
const showSellOrganModal = ref(false)
const showSellHealthModal = ref(false)

// === 商品详情 tooltip ===
const tooltipVisible = ref(false)
const tooltipItem = ref<StoreItem | null>(null)
const tooltipRef = ref<HTMLElement>()
const tooltipStyle = ref<Record<string, string>>({})
let tooltipTriggerEl: HTMLElement | null = null
let hideTimeout: ReturnType<typeof setTimeout> | null = null

function getPreview(itemId: string): any {
    return currentRoom.value?.getPreviewInstance(itemId) ?? null
}

function getRelicDesc(itemId: string): string {
    const instance = getPreview(itemId)
    if (!instance || !instance.describe) return ''
    return getDescribe(instance.describe, instance)
}

function getAbilityDesc(itemId: string, ability: any): string {
    const instance = getPreview(itemId)
    if (!ability.describe) return ''
    return getDescribe(ability.describe, instance)
}

function getPotionDesc(itemId: string): string {
    const instance = getPreview(itemId)
    if (!instance || !instance.describe) return ''
    return getDescribe(instance.describe, instance)
}

function showItemTooltip(item: StoreItem, event: MouseEvent) {
    if (item.isPurchased) return

    // 清除隐藏定时器
    if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
    }

    tooltipItem.value = item
    tooltipTriggerEl = event.currentTarget as HTMLElement
    tooltipVisible.value = true
    nextTick(updateTooltipPosition)
}

function startHideTooltip() {
    hideTimeout = setTimeout(() => {
        tooltipVisible.value = false
        tooltipItem.value = null
        tooltipTriggerEl = null
    }, 200)
}

function cancelHideTooltip() {
    if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
    }
}

function updateTooltipPosition() {
    if (!tooltipTriggerEl || !tooltipRef.value) return

    const triggerRect = tooltipTriggerEl.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    const vh = window.innerHeight
    const vw = window.innerWidth
    const gap = 8

    // 显示在下方
    let left = triggerRect.left
    let top = triggerRect.bottom + gap

    // 如果下方空间不足，显示在上方
    if (top + tooltipRect.height > vh) {
        top = triggerRect.top - tooltipRect.height - gap
    }

    // 如果上方也不够，强制下方并截断
    if (top < gap) {
        top = triggerRect.bottom + gap
    }

    // 水平边界
    if (left + tooltipRect.width > vw) {
        left = vw - tooltipRect.width - gap
    }
    if (left < gap) left = gap

    tooltipStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: '10000'
    }
}

// === 购买 ===
function canAfford(item: StoreItem): boolean {
    const reserveModifier = getReserveModifier(nowPlayer)
    return reserveModifier.getReserve('gold') >= item.price && !item.isPurchased
}

async function handlePurchase(item: StoreItem) {
    if (!currentRoom.value) return
    if (item.isPurchased) {
        newLog(['该商品已售出'])
        return
    }
    if (!canAfford(item)) {
        newLog(['金钱不足'])
        return
    }
    await currentRoom.value.purchaseItem(item.id)
}

// === 出售器官 ===
function handleSellOrgan() {
    showSellOrganModal.value = true
}

function closeSellOrganModal() {
    showSellOrganModal.value = false
}

async function confirmSellOrgan(organ: Organ) {
    if (!currentRoom.value) return
    await currentRoom.value.sellOrgan(organ)
    closeSellOrganModal()
}

// === 出售生命值 ===
function handleSellHealth() {
    showSellHealthModal.value = true
}

function closeSellHealthModal() {
    showSellHealthModal.value = false
}

function canSellHealthAmount(amount: number): boolean {
    return playerCurrentHealth.value > amount
}

function getHealthSellPrice(amount: number): number {
    return currentRoom.value?.getHealthSellPricePreview(amount) || 0
}

async function confirmSellHealth(amount: number) {
    if (!currentRoom.value) return
    if (!canSellHealthAmount(amount)) {
        newLog(['生命值不足'])
        return
    }
    await currentRoom.value.sellHealth(amount)
    closeSellHealthModal()
}

// === 离开 ===
async function handleLeave() {
    if (!currentRoom.value) return
    await nowGameRun.completeCurrentRoom()
    await goToNextStep()
}
</script>

<style scoped lang='scss'>
.blackstore-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    overflow-y: auto;
}

// 标题
.blackstore-header {
    text-align: center;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 2px solid black;
}

.blackstore-title {
    font-size: 2.2rem;
    margin: 0;
    font-weight: bold;
}

.blackstore-desc {
    margin: 0.5rem 0 0;
    font-size: 1rem;
    color: #666;
}

// 主体：左右分栏
.blackstore-body {
    display: flex;
    flex: 1;
    min-height: 0;
}

// 左侧面板
.side-panel {
    width: 200px;
    flex-shrink: 0;
    border-right: 2px solid black;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

// 金钱信息
.currency-box {
    border: 2px solid black;
    padding: 0.8rem;
}

.currency-title {
    font-weight: bold;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3rem;
}

.currency-row {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0;
    font-size: 0.9rem;
}

.currency-label {
    color: #666;
}

.currency-value {
    font-weight: bold;
}

// 出售区域
.sell-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sell-title {
    font-weight: bold;
    font-size: 1rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3rem;
}

.sell-option {
    border: 2px solid black;
    padding: 0.6rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.sell-option-name {
    font-weight: bold;
    font-size: 0.9rem;
}

.sell-option-desc {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.2rem;
}

.depreciation-note {
    color: red;
    font-weight: bold;
}

// 右侧商品区
.store-panel {
    flex: 1;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
}

.store-category {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.section-title {
    font-size: 1.2rem;
    margin: 0;
    border-bottom: 2px solid black;
    padding-bottom: 0.3rem;
}

// 下方分栏
.store-bottom {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
}

.store-bottom-left {
    flex-shrink: 0;
    min-width: 150px;
}

.store-bottom-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.items-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
}

.items-col {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.store-item {
    border: 2px solid black;
    padding: 0.8rem;
    min-width: 120px;
    max-width: 180px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;

    &:hover:not(.sold) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.can-afford {
        border-color: green;
    }

    &.sold {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.item-name {
    font-weight: bold;
    font-size: 1rem;
    margin-bottom: 0.3rem;
}

.item-rarity {
    font-size: 0.75rem;
    color: #888;
}

.item-price {
    font-size: 0.9rem;
    margin-top: 0.3rem;
}

.sold-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: bold;
    color: red;
}

// 商品详情 tooltip（与 Relic.vue 的 tooltip 样式一致）
.store-tooltip {
    .relic-tooltip {
        background: white;
        border: 2px solid black;
        min-width: 200px;
        max-width: 350px;

        .tooltip-header {
            padding: 8px 12px;
            border-bottom: 2px solid black;
            display: flex;
            align-items: center;
            gap: 8px;

            .relic-name {
                font-weight: bold;
                font-size: 14px;
            }

            .relic-rarity {
                font-size: 12px;
                color: #666;
            }
        }

        .tooltip-body {
            padding: 8px 12px;

            .relic-description {
                font-size: 13px;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .relic-abilities {
                border-top: 1px solid #ccc;
                padding-top: 8px;
                margin-top: 8px;

                .abilities-title {
                    font-weight: bold;
                    margin-bottom: 6px;
                    font-size: 12px;
                }

                .ability-item {
                    margin-bottom: 6px;
                    padding: 6px;
                    border: 1px solid #ccc;
                    background: #f9f9f9;

                    &:last-child {
                        margin-bottom: 0;
                    }

                    .ability-label {
                        font-weight: bold;
                        margin-bottom: 2px;
                        font-size: 12px;
                    }

                    .ability-desc {
                        font-size: 11px;
                        color: #666;
                        line-height: 1.4;
                    }
                }
            }
        }
    }

    .potion-tooltip {
        background: white;
        border: 2px solid black;
        padding: 12px;
        min-width: 200px;
        max-width: 300px;

        .potion-tooltip-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid #ccc;
        }

        .potion-tooltip-desc {
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
        }
    }
}

// 弹窗
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal-content {
    background: white;
    border: 2px solid black;
    padding: 1.5rem;
    max-width: 500px;
    width: 90%;
    max-height: 70vh;
    overflow-y: auto;
}

.modal-title {
    font-size: 1.4rem;
    margin: 0 0 1rem;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
}

.organ-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.organ-item {
    border: 2px solid black;
    padding: 0.8rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.organ-name {
    font-weight: bold;
}

.organ-sell-price {
    color: green;
    font-weight: bold;
    font-size: 0.9rem;
}

.empty-hint {
    text-align: center;
    color: #999;
    padding: 1rem;
}

.health-info {
    margin-bottom: 1rem;
    padding: 0.8rem;
    border: 2px solid black;

    p {
        margin: 0.3rem 0;
        font-size: 1rem;
    }

    .warning-text {
        color: red;
        font-weight: bold;
        font-size: 0.9rem;
    }
}

.health-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.health-option {
    border: 2px solid black;
    padding: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover:not(.disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

.health-amount {
    font-weight: bold;
}

.health-price {
    font-size: 0.9rem;
    color: green;
    font-weight: bold;
}

.modal-close {
    border: 2px solid black;
    padding: 0.6rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
