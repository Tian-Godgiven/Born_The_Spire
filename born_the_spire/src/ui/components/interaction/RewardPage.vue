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

    <!-- 器官选择弹窗 -->
    <div v-if="showOrganChoice" class="choice-overlay" @click.self="closeOrganChoice">
      <div class="choice-modal">
        <div class="choice-title">选择器官</div>
        <div class="choice-description">{{ currentChoiceReward?.getDisplayDescription() }}</div>

        <div class="choice-grid">
          <div
            v-for="organ in currentChoiceReward?.organOptions"
            :key="organ.key"
            class="choice-card"
            :class="{ selected: selectedOrganKey === organ.key }"
            @click="selectedOrganKey = organ.key"
          >
            <div class="choice-name">{{ organ.label }}</div>
            <div v-if="organ.description" class="choice-description">
              {{ organ.description }}
            </div>
          </div>
        </div>

        <div class="choice-actions">
          <button class="action-btn" @click="closeOrganChoice">取消</button>
          <button
            class="action-btn primary"
            :disabled="!selectedOrganKey"
            @click="confirmOrganChoice"
          >
            确认
          </button>
        </div>
      </div>
    </div>

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
import { ref, computed } from 'vue'
import { currentRewards, showRewardUI, rewardTitle, confirmRewards } from '@/ui/hooks/interaction/rewardDisplay'

const visible = computed(() => showRewardUI.value)
const rewards = computed(() => currentRewards.value)

// 器官选择弹窗
const showOrganChoice = ref(false)
const currentChoiceReward = ref<any>(null)
const selectedOrganKey = ref<string | null>(null)

function openOrganChoice(reward: any) {
  currentChoiceReward.value = reward
  selectedOrganKey.value = null
  showOrganChoice.value = true
}

function closeOrganChoice() {
  showOrganChoice.value = false
  currentChoiceReward.value = null
  selectedOrganKey.value = null
}

async function confirmOrganChoice() {
  if (!selectedOrganKey.value || !currentChoiceReward.value) return

  currentChoiceReward.value.selectedOrgans = [selectedOrganKey.value]
  await currentChoiceReward.value.claim()
  closeOrganChoice()
}

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
</style>
