import { shallowRef, type Component } from "vue"
import type { Reward } from "@/core/objects/reward/Reward"

export type RewardRowAddonArea = "info" | "action"

export type RewardRowAddon = {
    key: string
    component: Component
    onClaimed?: (reward: Reward) => void
    settle?: () => void | Promise<void>
    dismiss?: () => void
}

class RewardRowAddonRegistry {
    private addons = new Map<string, RewardRowAddon>()
    private addonList = shallowRef<RewardRowAddon[]>([])

    register(addon: RewardRowAddon) {
        if (this.addons.has(addon.key)) {
            console.warn(`[RewardRowAddonRegistry] ${addon.key} 已存在，将被覆盖`)
        }
        this.addons.set(addon.key, addon)
        this.addonList.value = [...this.addons.values()]
    }

    list(): RewardRowAddon[] {
        return this.addonList.value
    }

    notifyClaimed(reward: Reward) {
        for (const addon of this.addons.values()) {
            addon.onClaimed?.(reward)
        }
    }

    async settleAll() {
        for (const addon of this.addons.values()) {
            await addon.settle?.()
        }
    }

    dismissAll() {
        for (const addon of this.addons.values()) {
            addon.dismiss?.()
        }
    }
}

export const rewardRowAddonRegistry = new RewardRowAddonRegistry()
