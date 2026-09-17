import { markRaw } from "vue"
import { rewardRowAddonRegistry } from "@/static/registry/rewardRowAddonRegistry"
import BeastLootAddon from "@/ui/components/interaction/BeastLootAddon.vue"
import { dismissBeastLoot, onBeastLootClaimed, settleBeastLoot } from "@/ui/hooks/interaction/beastLoot"

rewardRowAddonRegistry.register({
    key: "hungry-beast",
    component: markRaw(BeastLootAddon),
    onClaimed: onBeastLootClaimed,
    settle: settleBeastLoot,
    dismiss: dismissBeastLoot
})
