<template>
  <div class="transplant-overlay" v-if="visible && config">
    <div class="transplant-modal">
      <div class="transplant-title">
        {{ phase === 1 ? '选择要转移的卡' : '选择目标器官' }}
      </div>

      <div v-if="phase === 1" class="transplant-body">
        <div v-for="group in config.groups" :key="group.organ.key" class="organ-group">
          <div class="organ-group-title">{{ group.organ.label }}</div>
          <div class="card-grid">
            <button v-for="(card, idx) in group.cards" :key="group.organ.key + '-' + idx"
                    class="card-btn"
                    @click="pickCard(card, group.organ)">
              {{ card.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="transplant-body">
        <div class="phase-hint">
          已选卡：<strong>{{ pickedCard?.label }}</strong>
          <span class="phase-hint-sub">（来自 {{ pickedFrom?.label }}）</span>
        </div>
        <div class="organ-list">
          <button v-for="organ in candidateOrgans" :key="organ.key"
                  class="organ-btn"
                  @click="pickOrgan(organ)">
            <div class="organ-btn-label">{{ organ.label }}</div>
            <div class="organ-btn-sub">当前带 {{ getCardCount(organ) }} 张卡</div>
          </button>
        </div>
        <div class="transplant-actions">
          <button class="action-btn" @click="backToPhase1">返回上一步</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import {
  showTransplantModal,
  transplantConfig,
  resolveTransplant
} from '@/ui/hooks/interaction/transplantSelect'
import type { Card } from '@/core/objects/item/Subclass/Card'
import type { Organ } from '@/core/objects/target/Organ'

const visible = computed(() => showTransplantModal.value)
const config = computed(() => transplantConfig.value)

const phase = ref<1 | 2>(1)
// shallowRef：Card/Organ 是含 private 字段的类实例，用 ref 会 unwrap 类型
const pickedCard = shallowRef<Card | null>(null)
const pickedFrom = shallowRef<Organ | null>(null)

watch(visible, (v) => {
  if (v) {
    phase.value = 1
    pickedCard.value = null
    pickedFrom.value = null
  }
})

const candidateOrgans = computed(() => {
  if (!config.value || !pickedFrom.value) return []
  return config.value.allOrgans.filter(o => o !== pickedFrom.value)
})

function getCardCount(organ: Organ): number {
  if (!config.value) return 0
  const g = config.value.groups.find(x => x.organ === organ)
  return g ? g.cards.length : 0
}

function pickCard(card: Card, from: Organ) {
  pickedCard.value = card
  pickedFrom.value = from
  phase.value = 2
}

function pickOrgan(organ: Organ) {
  if (!pickedCard.value) return
  resolveTransplant({ card: pickedCard.value, targetOrgan: organ })
}

function backToPhase1() {
  phase.value = 1
  pickedCard.value = null
  pickedFrom.value = null
}
</script>

<style scoped lang="scss">
.transplant-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.transplant-modal {
  background: white;
  border: 2px solid black;
  padding: 30px;
  min-width: 480px;
  max-width: 640px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transplant-title {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  color: #333;
  border-bottom: 2px solid black;
  padding-bottom: 15px;
}

.transplant-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.organ-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.organ-group-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #999;
  padding-bottom: 4px;
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-btn {
  padding: 8px 14px;
  font-size: 14px;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.phase-hint {
  font-size: 14px;
  color: #333;
}

.phase-hint-sub {
  color: #666;
}

.organ-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.organ-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 16px;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.organ-btn-label {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.organ-btn-sub {
  font-size: 12px;
  color: #666;
}

.transplant-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.action-btn {
  padding: 8px 20px;
  font-size: 14px;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
