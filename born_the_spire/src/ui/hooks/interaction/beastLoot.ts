import { ref } from "vue"
import type { Reward } from "@/core/objects/reward/Reward"
import { newLog } from "@/ui/hooks/global/log"

export interface BeastLootMark {
    reward: Reward
    relic: any
    forced: boolean
}

const FORCED_LABEL = "小兽叼走了"

export const beastLootMark = ref<BeastLootMark | null>(null)

export function markBeastLoot(reward: Reward, relic: any, forced: boolean) {
    beastLootMark.value = { reward, relic, forced }
    if (forced) reward.blockClaim(FORCED_LABEL)
    else reward.clearClaimBlock()
}

export function isBeastMarked(reward: Reward): boolean {
    return beastLootMark.value?.reward === reward
}

export function isBeastForced(reward: Reward): boolean {
    return isBeastMarked(reward) && !!beastLootMark.value?.forced
}

function clearBeastLootMark() {
    const mark = beastLootMark.value
    if (mark) mark.reward.clearClaimBlock()
    beastLootMark.value = null
}

function applyBeastGrab() {
    const mark = beastLootMark.value
    if (!mark) return
    const refuseStatus = mark.relic.status?.["hungry-beast-refuse-count"]
    if (refuseStatus) refuseStatus.setOriginalBaseValue((refuseStatus.value ?? 0) + 1)
    newLog([`${mark.relic.label ?? "小兽伙伴"}：你抢走了它看上的战利品`])
    clearBeastLootMark()
}

function applyBeastYield() {
    const mark = beastLootMark.value
    if (!mark) return
    const refuseStatus = mark.relic.status?.["hungry-beast-refuse-count"]
    const favorStatus = mark.relic.status?.["hungry-beast-favor"]
    if (favorStatus) favorStatus.setOriginalBaseValue((favorStatus.value ?? 0) + 1)
    if (refuseStatus) refuseStatus.setOriginalBaseValue(0)
    newLog([`${mark.relic.label ?? "小兽伙伴"}：你把「${mark.reward.getDisplayTitle()}」让给了它（好感度 +1）`])
    const reward = mark.reward
    clearBeastLootMark()
    reward.markAsClaimed()
}

export function feedBeastLoot(reward: Reward) {
    if (!isBeastMarked(reward) || isBeastForced(reward) || reward.isClaimed()) return
    applyBeastYield()
}

export function onBeastLootClaimed(reward: Reward) {
    if (!isBeastMarked(reward)) return
    applyBeastGrab()
}

export function settleBeastLoot() {
    const mark = beastLootMark.value
    if (!mark) return
    if (mark.reward.isClaimed()) {
        applyBeastGrab()
        return
    }
    applyBeastYield()
}

export function dismissBeastLoot() {
    clearBeastLootMark()
}
