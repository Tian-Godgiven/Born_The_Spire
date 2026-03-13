<template>
  <div class="card-group-overlay" v-if="visible" @click="handleClose">
    <div class="card-group-modal" @click.stop>
      <div class="card-group-header">
        <div class="card-group-title">{{ title }}</div>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="card-group-content">
        <div v-if="cards.length === 0" class="empty-message">
          暂无卡牌
        </div>
        <div v-else class="card-list">
          <Card
            v-for="card in cards"
            :key="card.__id"
            :card="card"
            :side="'left'"
          />
        </div>
      </div>

      <div class="card-group-footer">
        <span class="card-count">共 {{ cards.length }} 张卡牌</span>
        <button class="action-btn" @click="handleClose">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/ui/components/object/Card.vue'
import {
  showCardGroupModal,
  cardGroupTitle,
  cardGroupList,
  closeCardGroupModal
} from '@/ui/hooks/interaction/cardGroupModal'

const visible = computed(() => showCardGroupModal.value)
const title = computed(() => cardGroupTitle.value)
const cards = computed(() => cardGroupList.value)

function handleClose() {
  closeCardGroupModal()
}
</script>

<style scoped lang="scss">
.card-group-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.card-group-modal {
  background: white;
  border: 2px solid black;
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.card-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid black;
}

.card-group-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 30px;
  height: 30px;
  font-size: 24px;
  line-height: 1;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.card-group-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  max-height: 70vh;
}

.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.empty-message {
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #666;
}

.card-group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 2px solid #ddd;
}

.card-count {
  font-size: 14px;
  color: #666;
}

.action-btn {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
