<template>
  <div class="reward-modal-overlay" v-if="visible">
    <div class="reward-modal">
      <div class="modal-title">战利品</div>

      <div class="rewards-list">
        <div
          v-for="reward in rewards"
          :key="reward.__key"
          class="reward-row"
          :class="{
            claimed: reward.isClaimed(),
            locked: reward.isLocked()
          }"
        >
            <div class="reward-info">
              <span class="reward-icon">{{ reward.getDisplayIcon() }}</span>
              <div class="reward-text-col">
                <Popover
                  v-if="relicPreviewOf(reward)"
                  inline
                  placement="right"
                  align="start"
                  :max-width="360"
                >
                  <span class="reward-text relic-hover-name">{{ reward.getDisplayTitle() }}</span>
                  <template #content>
                    <RelicHoverContent :relic="relicPreviewOf(reward)!" />
                  </template>
                </Popover>
                <span v-else class="reward-text">{{ reward.getDisplayTitle() }}</span>
                <component
                  v-for="addon in rewardRowAddons"
                  :key="addon.key + '-info'"
                  :is="addon.component"
                  :reward="reward"
                  area="info"
                />
              </div>
            </div>

            <div class="reward-action">
              <component
                v-for="addon in rewardRowAddons"
                :key="addon.key + '-action'"
                :is="addon.component"
                :reward="reward"
                area="action"
              />

              <button
                v-if="reward.type === 'organSelect' && canClaim(reward)"
                class="action-btn"
                @click="openOrganChoice(reward)"
              >
                查看选择
              </button>

              <button
                v-else-if="reward.type === 'relicSelect' && canClaim(reward)"
                class="action-btn"
                @click="openRelicChoice(reward)"
              >
                查看选择
              </button>

              <button
                v-else-if="reward.type === 'cardSelect' && canClaim(reward)"
                class="action-btn"
                @click="openCardChoice(reward)"
              >
                查看选择
              </button>

              <button
                v-else-if="canClaim(reward)"
                class="action-btn"
                @click="claimReward(reward)"
              >
                领取
              </button>

              <span v-if="reward.isClaimBlocked() && !reward.isClaimed()" class="locked-text">{{ reward.claimBlockedLabel }}</span>
              <span v-else-if="reward.isLocked()" class="locked-text">已锁定</span>
              <span v-else-if="reward.isClaimed()" class="claimed-text">已领取</span>
            </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="action-btn primary" :disabled="!canProceed()" @click="handleProceed">
          前进
        </button>
        <div v-if="requireAllRewards && !canProceed()" class="require-hint">
          请先领取所有奖励
        </div>
        <div v-if="potionBarFullHint" class="require-hint">
          药水栏已满，请先在顶部丢掉一瓶再领取
        </div>
      </div>
    </div>

    <!-- 器官奖励弹窗 -->
    <div v-if="showOrganReward" class="choice-overlay" @click.self="organRewardCancelable ? closeOrganReward() : undefined">
      <div class="organ-reward-modal">
        <button v-if="organRewardCancelable" class="modal-close-btn" @click="closeOrganReward">×</button>
        <div class="choice-title">选择器官</div>

        <!-- 介绍常驻在卡片上；悬停只出里程碑，术语板由介绍框自己带 -->
        <div class="organ-cards-row">
          <Popover
            v-for="organ in organRewardPreviews"
            :key="organ.key"
            placement="right"
            align="start"
            :max-width="240"
            :disabled="getOrganMilestones(organ).length === 0"
          >
            <div
              class="organ-reward-option"
              :class="{ selected: selectedOrganKey === organ.key }"
              @click="selectOrgan(organ.key)"
            >
              <OrganPopup :organ="organ" prefer-player-cards />
            </div>
            <template #content>
              <OrganMilestoneTrack :organ="organ" />
            </template>
          </Popover>
        </div>

        <!-- 底部行：动作按钮 -->
        <div class="organ-reward-footer">
          <button
            v-for="action in organActions"
            :key="action.key"
            class="organ-action-btn"
            @click="executeOrganAction(action.key)"
          >
            <span class="action-label">{{ action.label }}</span>
            <span class="action-desc">{{ action.description }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 遗物选择弹窗 -->
    <div v-if="showRelicChoice" class="choice-overlay" @click.self="closeRelicChoice">
      <div class="choice-modal">
        <div class="choice-title">选择遗物</div>
        <div class="choice-description">{{ currentChoiceReward?.getDisplayDescription() }}</div>

        <div class="choice-grid single-column">
          <div
            v-for="relic in relicInstances"
            :key="relic.key"
            class="choice-card relic-choice-card"
            :class="{ selected: selectedRelicKey === relic.key }"
            @click="selectedRelicKey = relic.key"
          >
            <!-- preview 模式：隐藏角标、禁用点击/右键，只保留悬浮详情 -->
            <Relic :relic="relic" preview />
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

    <!-- 卡牌选择弹窗 -->
    <div v-if="showCardChoice" class="choice-overlay" @click.self="closeCardChoice">
      <div class="choice-modal">
        <div class="choice-title">选择卡牌</div>
        <div class="choice-description">{{ currentChoiceReward?.getDisplayDescription() }}</div>

        <div class="choice-cards-row">
          <div
            v-for="card in cardInstances"
            :key="card.key"
            class="choice-card card-choice-card"
            :class="{ selected: selectedCardKey === card.key }"
            @click="selectedCardKey = card.key"
          >
            <Card :card="card" />
          </div>
        </div>

        <div class="choice-actions">
          <button class="action-btn" @click="closeCardChoice">取消</button>
          <button
            class="action-btn primary"
            :disabled="!selectedCardKey"
            @click="confirmCardChoice"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, shallowRef, watch } from 'vue'
import { currentRewards, showRewardUI, navigateOnProceed, handleExclusiveGroup, canProceed, requireAllRewards, hideRewardUI, releaseRewardWaiter, settlePendingRewards } from '@/ui/hooks/interaction/rewardDisplay'
import { organRewardActionRegistry } from '@/static/registry/organRewardActionRegistry'
import { rewardRowAddonRegistry } from '@/static/registry/rewardRowAddonRegistry'
import { nowPlayer } from '@/core/objects/game/run'
import { getOrganMilestones } from '@/static/list/target/organQuality'
import { Organ } from '@/core/objects/target/Organ'
import type { OrganMap } from '@/core/objects/target/Organ'
import type { OrganRewardAction } from '@/core/types/organRewardAction'
import Card from '@/ui/components/object/Card.vue'
import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
import Relic from '@/ui/components/object/Relic.vue'
import RelicHoverContent from '@/ui/components/interaction/RelicHoverContent.vue'
import type { Relic as RelicType } from '@/core/objects/item/Subclass/Relic'
import Popover from '@/ui/components/global/Popover.vue'
import OrganPopup from '@/ui/components/interaction/OrganPopup.vue'
import OrganMilestoneTrack from '@/ui/components/interaction/OrganMilestoneTrack.vue'
import type { Reward } from '@/core/objects/reward/Reward'
const visible = computed(() => showRewardUI.value)
const rewards = computed(() => currentRewards.value)
const rewardRowAddons = computed(() => rewardRowAddonRegistry.list())
const potionBarFullHint = ref(false)
const relicPreviews = shallowRef<Record<string, RelicType>>({})
let relicPreviewSeq = 0

function relicPreviewOf(reward: any): RelicType | undefined {
  return relicPreviews.value[reward.__key]
}

watch(rewards, async (list) => {
  const seq = ++relicPreviewSeq
  const entries: [string, RelicType][] = []
  const { createRelic } = await import('@/core/factories')
  for (const reward of list) {
    if (reward.type !== 'relic' || !reward.relicConfig) continue
    const relic = await createRelic(reward.relicConfig)
    if (seq !== relicPreviewSeq) return
    entries.push([reward.__key, markRaw(relic as RelicType)])
  }
  if (seq !== relicPreviewSeq) return
  relicPreviews.value = Object.fromEntries(entries)
}, { immediate: true })

function canClaim(reward: Reward) {
  return !reward.isClaimed() && !reward.isLocked() && !reward.isClaimBlocked()
}

watch(visible, (v) => {
  if (v) potionBarFullHint.value = false
})

// 器官奖励弹窗
const showOrganReward = ref(false)
const currentOrganReward = ref<any>(null)
const selectedOrganKey = ref<string | null>(null)
const organActions = ref<OrganRewardAction[]>([])
const organRewardCancelable = ref(true)

const organRewardOptions = computed<OrganMap[]>(() => currentOrganReward.value?.organOptions ?? [])
const organRewardPreviews = computed(() =>
    organRewardOptions.value.map(data => markRaw(new Organ(data)))
)

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
  rewardRowAddonRegistry.notifyClaimed(reward)
  handleExclusiveGroup(reward)
}

const currentChoiceReward = ref<any>(null)

// 遗物选择弹窗
const showRelicChoice = ref(false)
const selectedRelicKey = ref<string | null>(null)
// 预览用的 Relic 实例：relicOptions 是纯数据（RelicMap），
// 而 Relic.vue 的悬浮详情要靠实例才能解析 describe 里的 {key:["status",...]} 动态值
const relicInstances = shallowRef<RelicType[]>([])

async function openRelicChoice(reward: any) {
  currentChoiceReward.value = reward
  selectedRelicKey.value = null
  relicInstances.value = []
  showRelicChoice.value = true

  const { createRelic } = await import('@/core/factories')
  const options = reward?.relicOptions ?? []
  const instances = await Promise.all(options.map((map: any) => createRelic(map)))
  // markRaw 防止 Vue 深度包装破坏 Status 内部的 ref
  relicInstances.value = instances.map(relic => markRaw(relic as RelicType))
}

function closeRelicChoice() {
  showRelicChoice.value = false
  currentChoiceReward.value = null
  selectedRelicKey.value = null
  relicInstances.value = []
}

async function confirmRelicChoice() {
  if (!selectedRelicKey.value || !currentChoiceReward.value) return

  const reward = currentChoiceReward.value
  reward.selectedRelics = [selectedRelicKey.value]
  await reward.claim()
  rewardRowAddonRegistry.notifyClaimed(reward)
  handleExclusiveGroup(reward)
  closeRelicChoice()
}

// 卡牌选择弹窗
const showCardChoice = ref(false)
const selectedCardKey = ref<string | null>(null)
// 同遗物：cardOptions 是纯数据（CardMap），Card.vue 要实例才能渲染完整卡面
const cardInstances = shallowRef<CardType[]>([])

async function openCardChoice(reward: any) {
  currentChoiceReward.value = reward
  selectedCardKey.value = null
  cardInstances.value = []
  showCardChoice.value = true

  const { createCard } = await import('@/core/factories')
  const options = reward?.cardOptions ?? []
  const instances = await Promise.all(options.map((map: any) => createCard(map)))
  cardInstances.value = instances.map(card => markRaw(card as CardType))
}

function closeCardChoice() {
  showCardChoice.value = false
  currentChoiceReward.value = null
  selectedCardKey.value = null
  cardInstances.value = []
}

async function confirmCardChoice() {
  if (!selectedCardKey.value || !currentChoiceReward.value) return

  const reward = currentChoiceReward.value
  reward.selectedCards = [selectedCardKey.value]
  await reward.claim()
  rewardRowAddonRegistry.notifyClaimed(reward)
  handleExclusiveGroup(reward)
  closeCardChoice()
}

// 领取奖励
async function claimReward(reward: any) {
  potionBarFullHint.value = false
  await reward.claim()
  if (reward.type === 'potion' && !reward.isClaimed()) {
    potionBarFullHint.value = true
    return
  }
  rewardRowAddonRegistry.notifyClaimed(reward)
  handleExclusiveGroup(reward)
}

// 前进
async function handleProceed() {
  closeOrganReward()
  closeRelicChoice()
  closeCardChoice()

  if (navigateOnProceed.value) {
    hideRewardUI()
    releaseRewardWaiter()
    const { openMapToLeave } = await import('@/core/hooks/step')
    await openMapToLeave()
    return
  }

  await settlePendingRewards()
}
</script>

<style scoped lang="scss">
.reward-modal-overlay {
  position: fixed;
  top: var(--running-top-height, 8vh);
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.reward-modal {
  background: white;
  border: 2px solid black;
  padding: var(--layout-reward-pad);
  min-width: var(--layout-reward-min-width);
  max-width: var(--layout-reward-max-width);
  min-height: var(--layout-reward-min-height);
  max-height: var(--layout-reward-max-height);
  display: flex;
  flex-direction: column;
  gap: var(--layout-reward-gap);
  box-sizing: border-box;
}

.modal-title {
  font-size: var(--layout-reward-title-size);
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

  .reward-row:last-child {
    border-bottom: none;
  }
}

.reward-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--layout-reward-row-pad);
  border-bottom: 2px solid black;
  background: white;
  transition: background 0.2s;

  &:hover:not(.claimed) {
    background: rgba(0, 0, 0, 0.02);
  }

  &.claimed {
    opacity: 0.6;
  }

  &.locked {
    opacity: 0.4;
    background: #f5f5f5;
  }
}

.reward-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: var(--layout-reward-font);
}

.reward-icon {
  font-size: var(--layout-reward-icon-size);
  width: 1.25em;
  text-align: center;
}

.reward-text-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reward-text {
  font-weight: bold;
  color: #333;
}

.relic-hover-name {
  border-bottom: 1px solid black;
}

.reward-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.claimed-text {
  color: #999;
  font-size: 14px;
}

.locked-text {
  color: #bbb;
  font-size: 14px;
}

.require-hint {
  font-size: 13px;
  color: #999;
  text-align: center;
  margin-top: 5px;
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

  > :deep(.popover-trigger) {
    display: block;
    flex: 0 0 var(--layout-organ-popup-width);
  }
}

.organ-reward-option {
  height: var(--organ-reward-option-height, auto);
  cursor: pointer;

  :deep(.organ-popup) {
    height: 100%;
    overflow-y: auto;
  }

  &.selected :deep(.organ-popup) {
    --organ-popup-background: #000;
    --organ-popup-color: #fff;

    .popup-content,
    .popup-entries,
    .popup-states {
      color: #fff;
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
  top: var(--running-top-height, 8vh);
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

// 遗物选择：一列铺开，详情走遗物自身的悬浮框，不需要并排比较
.choice-grid.single-column {
  grid-template-columns: 1fr;
}

// 卡牌选择：卡面是固定尺寸的卡片，横排居中，不走网格
.choice-cards-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.card-choice-card {
  padding: 6px;
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

.choice-card.relic-choice-card {
  padding: 0;
  border: none;
  background: transparent;

  &:hover,
  &.selected {
    border: none;
    background: transparent;
  }

  &:hover :deep(.relic),
  &.selected :deep(.relic) {
    background: rgba(0, 0, 0, 0.05);
  }
}

.choice-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

</style>
