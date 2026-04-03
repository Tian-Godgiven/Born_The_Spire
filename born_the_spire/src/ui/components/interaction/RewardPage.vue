<template>
  <div class="reward-modal-overlay" v-if="visible">
    <div class="reward-modal">
      <div class="modal-title">战利品</div>

      <div class="rewards-list">
        <!-- 遍历所有奖励，每个奖励一行 -->
        <div
          v-for="reward in rewards"
          :key="reward.__key"
          class="reward-row"
          :class="{ claimed: reward.isClaimed() }"
        >
          <div class="reward-info">
            <span class="reward-icon">{{ reward.getDisplayIcon() }}</span>
            <span class="reward-text">{{ reward.getDisplayTitle() }}</span>
          </div>

          <div class="reward-action">
            <!-- 器官选择 -->
            <button
              v-if="reward.type === 'organSelect' && !reward.isClaimed()"
              class="action-btn"
              @click="openOrganChoice(reward)"
            >
              查看选择
            </button>

            <!-- 遗物选择 -->
            <button
              v-else-if="reward.type === 'relicSelect' && !reward.isClaimed()"
              class="action-btn"
              @click="openRelicChoice(reward)"
            >
              查看选择
            </button>

            <!-- 可点击领取的奖励（金币、物质、药水等） -->
            <button
              v-else-if="!reward.isClaimed()"
              class="action-btn"
              @click="claimReward(reward)"
            >
              领取
            </button>

            <!-- 已领取 -->
            <span v-else class="claimed-text">已领取</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="action-btn primary" @click="handleProceed">
          前进
        </button>
      </div>
    </div>

    <!-- 器官奖励弹窗 -->
    <div v-if="showOrganReward" class="choice-overlay" @click.self="organRewardCancelable ? closeOrganReward() : undefined">
      <div class="organ-reward-modal">
        <button v-if="organRewardCancelable" class="modal-close-btn" @click="closeOrganReward">×</button>
        <div class="choice-title">选择器官</div>

        <!-- 横向器官卡片 -->
        <div class="organ-cards-row">
          <div
            v-for="organ in organRewardOptions"
            :key="organ.key"
            class="organ-detail-card"
            :class="{ selected: selectedOrganKey === organ.key }"
            @click="selectOrgan(organ.key)"
          >
            <div class="organ-card-name">{{ organ.label }}</div>
            <div class="organ-card-meta">
              <span class="organ-rarity" :class="organ.rarity">{{ getRarityLabel(organ.rarity) }}</span>
              <span v-if="organ.part" class="organ-part">{{ getPartLabel(organ.part) }}</span>
            </div>
            <div class="organ-card-divider"></div>
            <div v-if="organ.entry?.length" class="organ-card-entries">
              <span v-for="entry in organ.entry" :key="entry" class="entry-tag">【{{ entry }}】</span>
            </div>
            <div class="organ-card-desc">
                <span
                    v-for="(seg, si) in getOrganDescribeSegments(organ)"
                    :key="si"
                    :class="seg.type === 'card' ? 'card-term' : ''"
                    @mouseenter="seg.type === 'card' ? handleOrganCardHover(organ, seg, $event) : undefined"
                    @mouseleave="seg.type === 'card' ? hideOrganCardPopover() : undefined"
                >{{ seg.text }}</span>
              </div>
          </div>
        </div>

        <!-- 底部行：动作按钮 -->
        <div class="organ-reward-footer">
          <button
            v-for="action in organActions"
            :key="action.key"
            class="organ-action-btn"
            @click="executeOrganAction(action.key)"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-label">{{ action.label }}</span>
            <span class="action-desc">{{ action.description }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 器官预览卡牌弹窗 -->
    <Teleport to="body">
      <div v-if="organHoveredCard" ref="organCardPopoverRef" class="organ-card-popover" :style="organCardPopoverStyle">
        <Card :card="organHoveredCard" />
      </div>
    </Teleport>

    <!-- 遗物选择弹窗 -->
    <div v-if="showRelicChoice" class="choice-overlay" @click.self="closeRelicChoice">
      <div class="choice-modal">
        <div class="choice-title">选择遗物</div>
        <div class="choice-description">{{ currentChoiceReward?.getDisplayDescription() }}</div>

        <div class="choice-grid">
          <div
            v-for="relic in currentChoiceReward?.relicOptions"
            :key="relic.key"
            class="choice-card"
            :class="{ selected: selectedRelicKey === relic.key }"
            @click="selectedRelicKey = relic.key"
          >
            <div class="choice-name">{{ relic.label }}</div>
            <div v-if="relic.description" class="choice-description">
              {{ relic.description }}
            </div>
          </div>
        </div>

        <div class="choice-actions">
          <button class="action-btn" @click="closeRelicChoice">取消</button>
          <button
            class="action-btn primary"
            :disabled="!selectedRelicKey"
            @click="confirmRelicChoice"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, markRaw, shallowRef } from 'vue'
import { currentRewards, showRewardUI, confirmRewards } from '@/ui/hooks/interaction/rewardDisplay'
import { organRewardActionRegistry } from '@/static/registry/organRewardActionRegistry'
import { nowPlayer } from '@/core/objects/game/run'
import { getDescribe, getDescribeStructured, type DescribeSegment } from '@/ui/hooks/express/describe'
import { getPartLabel } from '@/static/list/target/organPart'
import type { OrganMap } from '@/core/objects/target/Organ'
import type { OrganRewardAction } from '@/core/types/organRewardAction'
import Card from '@/ui/components/object/Card.vue'
import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
import { getLazyModule } from '@/core/utils/lazyLoader'

const visible = computed(() => showRewardUI.value)
const rewards = computed(() => currentRewards.value)

// 器官奖励弹窗
const showOrganReward = ref(false)
const currentOrganReward = ref<any>(null)
const selectedOrganKey = ref<string | null>(null)
const organActions = ref<OrganRewardAction[]>([])
const organRewardCancelable = ref(true)

const organRewardOptions = computed<OrganMap[]>(() => currentOrganReward.value?.organOptions ?? [])

function openOrganChoice(reward: any) {
  currentOrganReward.value = reward
  selectedOrganKey.value = null
  organActions.value = []
  organRewardCancelable.value = reward.cancelable !== false
  showOrganReward.value = true
}

function closeOrganReward() {
  showOrganReward.value = false
  currentOrganReward.value = null
  selectedOrganKey.value = null
  organActions.value = []
}

function selectOrgan(organKey: string) {
  selectedOrganKey.value = organKey
  if (!nowPlayer) return
  organActions.value = organRewardActionRegistry.getAvailableActions(null, nowPlayer, { source: 'battleReward' })
    .filter(action => {
      if (typeof action.enabled === 'function') {
        return action.enabled(null as any, nowPlayer)
      }
      return action.enabled
    })
}

async function executeOrganAction(actionKey: string) {
  if (!selectedOrganKey.value || !currentOrganReward.value) return
  const reward = currentOrganReward.value
  reward.selectedOrgans = [selectedOrganKey.value]
  reward.selectedActions = new Map([[selectedOrganKey.value, actionKey]])
  closeOrganReward()
  await reward.claim()
}

function getOrganDescribe(organ: OrganMap): string {
  return getDescribe(organ.describe, organ)
}

// 器官卡牌预览相关
const organHoveredCard = shallowRef<CardType | null>(null)
const organCardPopoverRef = ref<HTMLElement | null>(null)
const organCardPopoverStyle = ref<Record<string, string>>({})

function getOrganDescribeSegments(organ: OrganMap): DescribeSegment[] {
  return getDescribeStructured(organ.describe, organ)
}

async function handleOrganCardHover(organ: OrganMap, segment: DescribeSegment, event: MouseEvent) {
  if (segment.type !== 'card' || segment.cardRef == null) return

  let cardKey: string | undefined
  if (typeof segment.cardRef === 'number') {
    const playerCards = organ.cardsByOwner?.player
    cardKey = (Array.isArray(playerCards) ? playerCards[segment.cardRef] : playerCards)
      ?? organ.cards?.[segment.cardRef]
  }

  if (!cardKey) return

  const card = await createOrganCardFromKey(cardKey)
  if (card) {
    // 使用 markRaw 防止 Card 对象被 ref 深度包装
    organHoveredCard.value = markRaw(card)
    nextTick(() => updateOrganCardPopoverPosition(event.target as HTMLElement))
  }
}

function hideOrganCardPopover() {
  organHoveredCard.value = null
}

async function createOrganCardFromKey(cardKey: string): Promise<CardType | null> {
  try {
    const cardList = getLazyModule<any[]>('cardList')
    const cardData = cardList.find((c: any) => c.key === cardKey)
    if (!cardData) return null
    const { createCard } = await import('@/core/factories')
    return await createCard(cardData)
  } catch {
    return null
  }
}

function updateOrganCardPopoverPosition(triggerElement: HTMLElement) {
  if (!organCardPopoverRef.value) return

  const triggerRect = triggerElement.getBoundingClientRect()
  const popoverRect = organCardPopoverRef.value.getBoundingClientRect()
  let left = triggerRect.right + 8
  let top = triggerRect.top
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (left + popoverRect.width > vw) left = triggerRect.left - popoverRect.width - 8
  if (left < 0) left = Math.max(8, vw - popoverRect.width - 8)
  if (top + popoverRect.height > vh) top = vh - popoverRect.height - 8
  if (top < 0) top = 8

  organCardPopoverStyle.value = { position: 'fixed', top: `${top}px`, left: `${left}px`, zIndex: '10001' }
}

function getRarityLabel(rarity: string): string {
  const map: Record<string, string> = { common: '普通', uncommon: '罕见', rare: '稀有' }
  return map[rarity] ?? rarity
}

const currentChoiceReward = ref<any>(null)

// 遗物选择弹窗
const showRelicChoice = ref(false)
const selectedRelicKey = ref<string | null>(null)

function openRelicChoice(reward: any) {
  currentChoiceReward.value = reward
  selectedRelicKey.value = null
  showRelicChoice.value = true
}

function closeRelicChoice() {
  showRelicChoice.value = false
  currentChoiceReward.value = null
  selectedRelicKey.value = null
}

async function confirmRelicChoice() {
  if (!selectedRelicKey.value || !currentChoiceReward.value) return

  currentChoiceReward.value.selectedRelics = [selectedRelicKey.value]
  await currentChoiceReward.value.claim()
  closeRelicChoice()
}

// 领取奖励
async function claimReward(reward: any) {
  await reward.claim()
}

// 前进
async function handleProceed() {
  // 自动领取所有未领取的奖励
  for (const reward of rewards.value) {
    if (!reward.isClaimed()) {
      if (reward.type === 'organSelect' || reward.type === 'relicSelect') {
        // 跳过选择类奖励
        reward.markAsClaimed()
      } else {
        await reward.claim()
      }
    }
  }

  // 关闭奖励界面
  confirmRewards()

  // 完成当前房间并前往下一步（显示地图）
  const { completeAndGoNext } = await import('@/core/hooks/step')
  await completeAndGoNext()
}
</script>

<style scoped lang="scss">
.reward-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.reward-modal {
  background: white;
  border: 2px solid black;
  padding: 40px;
  min-width: 600px;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  color: #2d5016;
  border-bottom: 2px solid black;
  padding-bottom: 15px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 2px solid black;
}

.reward-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid black;
  background: white;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(.claimed) {
    background: rgba(0, 0, 0, 0.02);
  }

  &.claimed {
    opacity: 0.6;
  }
}

.reward-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
}

.reward-icon {
  font-size: 24px;
  width: 30px;
  text-align: center;
}

.reward-text {
  font-weight: bold;
  color: #333;
}

.reward-action {
  display: flex;
  align-items: center;
}

.claimed-text {
  color: #999;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.action-btn {
  padding: 10px 25px;
  font-size: 16px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: #2d5016;
    color: white;
    border-color: #2d5016;
    padding: 12px 40px;

    &:hover:not(:disabled) {
      background: #3d6026;
    }
  }
}

.organ-reward-modal {
  position: relative;
  background: white;
  border: 2px solid black;
  padding: 30px;
  min-width: 700px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.organ-cards-row {
  display: flex;
  flex-direction: row;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.organ-detail-card {
  flex: 0 0 200px;
  min-height: 200px;
  padding: 16px;
  border: 2px solid #ccc;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    border-color: #888;
    background: rgba(0, 0, 0, 0.02);
  }

  &.selected {
    border-color: black;
    background: rgba(0, 0, 0, 0.04);
  }
}

.organ-card-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.organ-card-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.organ-rarity {
  &.common { color: #666; }
  &.uncommon { color: #2d5016; }
  &.rare { color: #1a3a6b; }
}

.organ-card-divider {
  height: 1px;
  background: #ddd;
}

.organ-card-entries {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.entry-tag {
  font-size: 12px;
  color: #555;
  font-weight: bold;
}

.organ-card-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  flex: 1;

  .card-term {
    color: #2563eb;
    font-weight: bold;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
      color: #1d4ed8;
    }
  }
}

.organ-reward-footer {
  display: flex;
  gap: 12px;
  border-top: 2px solid black;
  padding-top: 16px;
  min-height: 72px;
}

.organ-action-btn {
  flex: 1;
  padding: 12px 16px;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .action-icon { font-size: 20px; }
  .action-label { font-size: 15px; font-weight: bold; }
  .action-desc { font-size: 12px; color: #666; }
}

// 选择弹窗样式
.choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
}

.choice-modal {
  background: white;
  border: 2px solid black;
  padding: 30px;
  min-width: 500px;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.choice-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #333;
}

.choice-description {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.choice-card {
  padding: 15px;
  border: 2px solid #ccc;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #888;
    background: #f5f5f5;
  }

  &.selected {
    border-color: #2d5016;
    background: #e8f5e9;
  }
}

.choice-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.choice-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.organ-card-popover {
  background: white;
  border: 2px solid black;
  padding: 4px;
}
</style>
