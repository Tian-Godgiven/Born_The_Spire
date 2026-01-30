import { ref } from 'vue'
import { Organ } from '@/core/objects/target/Organ'

/**
 * 确认弹窗状态
 */
export const showConfirmModal = ref(false)
export const confirmTitle = ref('')
export const confirmMessage = ref('')
export const confirmOrgan = ref<Organ | null>(null)
export const confirmMaterial = ref(0)

let confirmResolver: ((confirmed: boolean) => void) | null = null

/**
 * 显示确认弹窗
 */
export function showConfirm(
  title: string,
  message: string,
  organ?: Organ,
  material?: number
): Promise<boolean> {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmOrgan.value = organ || null
  confirmMaterial.value = material || 0
  showConfirmModal.value = true

  return new Promise<boolean>((resolve) => {
    confirmResolver = resolve
  })
}

/**
 * 确认
 */
export function confirmAction() {
  showConfirmModal.value = false
  if (confirmResolver) {
    confirmResolver(true)
    confirmResolver = null
  }
}

/**
 * 取消
 */
export function cancelAction() {
  showConfirmModal.value = false
  if (confirmResolver) {
    confirmResolver(false)
    confirmResolver = null
  }
}
