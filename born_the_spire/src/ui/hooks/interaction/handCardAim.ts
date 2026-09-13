import { ref } from "vue"
import { nowBattle } from "@/core/objects/game/battle"
import { Target } from "@/core/objects/target/Target"
import { targetManager } from "@/ui/interaction/target/targetManager"
import {
    autoChooseTarget,
    chooseAFaction,
    chooseATarget,
    endChooseTarget,
    nowChooseAction
} from "@/ui/interaction/target/chooseTarget"

/** 手牌正在按住瞄准的卡牌 id。 */
export const aimingHandCardId = ref<string | null>(null)

export const ARM_DISTANCE_PX = 90
export const MAX_TILT_DEG = 10
export const TILT_RANGE_PX = 180
export const LIFT_PX = 22

export function clampTilt(dx: number): number {
    const raw = (dx / TILT_RANGE_PX) * MAX_TILT_DEG
    return Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, raw))
}

export function distanceFrom(x: number, y: number, originX: number, originY: number): number {
    return Math.hypot(x - originX, y - originY)
}

export type AimDrop =
    | { kind: "hand" }
    | { kind: "target", target: Target }
    | { kind: "faction", faction: string }
    | { kind: "play" }
    | { kind: "none" }

export function hitAimDrop(clientX: number, clientY: number): AimDrop {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    if (!el) return { kind: "none" }
    if (el.closest("[data-hand-pile]")) return { kind: "hand" }

    const targetEl = el.closest("[data-battle-target-id]") as HTMLElement | null
    if (targetEl?.dataset.battleTargetId) {
        const rec = targetManager.getTarget(targetEl.dataset.battleTargetId)
        if (rec?.chooseState.isSelectable) {
            return { kind: "target", target: rec.target as Target }
        }
    }

    const factionEl = el.closest("[data-battle-faction]") as HTMLElement | null
    if (factionEl?.dataset.battleFaction) {
        const rec = targetManager.getFaction(factionEl.dataset.battleFaction)
        if (rec?.chooseState.isSelectable) {
            return { kind: "faction", faction: factionEl.dataset.battleFaction }
        }
    }

    return { kind: "play" }
}

let hoveredTarget: Target | null = null
let hoveredFaction: string | null = null

/** pointer capture 期间目标收不到 mouseenter，用落点同步选择框虚线→实线。 */
export function syncAimHover(drop: AimDrop) {
    const nextTarget = drop.kind === "target" ? drop.target : null
    const nextFaction = drop.kind === "faction" ? drop.faction : null

    if (hoveredTarget !== nextTarget) {
        if (hoveredTarget) {
            targetManager.setTargetState(hoveredTarget, "isHovered", false)
        }
        if (nextTarget) {
            targetManager.setTargetState(nextTarget, "isHovered", true)
            nowChooseAction.value.onHover?.(nextTarget)
        } else if (hoveredTarget) {
            nowChooseAction.value.onHover?.(undefined)
        }
        hoveredTarget = nextTarget
    }

    if (hoveredFaction !== nextFaction) {
        if (hoveredFaction) {
            targetManager.setFactionState(hoveredFaction, "isHovered", false)
        }
        if (nextFaction) {
            targetManager.setFactionState(nextFaction, "isHovered", true)
        }
        hoveredFaction = nextFaction
    }
}

export function clearAimHover() {
    syncAimHover({ kind: "none" })
}

/** 松手：有合法落点则打出，否则取消。 */
export function confirmAimedPlay(drop: AimDrop): boolean {
    const rule = nowChooseAction.value.chooseRule
    if (!rule) return false

    if (drop.kind === "hand" || drop.kind === "none") {
        endChooseTarget()
        return false
    }

    if (rule.noNeedChoose) {
        autoChooseTarget()
        return true
    }

    if (drop.kind === "target") {
        chooseATarget(drop.target)
        return true
    }

    if (drop.kind === "faction") {
        const battle = nowBattle.value
        const members = drop.faction === "all"
            ? [...(battle?.getTeam("player") ?? []), ...(battle?.getTeam("enemy") ?? [])]
            : (battle?.getTeam(drop.faction as "player" | "enemy") ?? [])
        chooseAFaction(members)
        return true
    }

    endChooseTarget()
    return false
}

export function cancelAimedPlay() {
    if (nowChooseAction.value.chooseRule) {
        endChooseTarget()
    }
}

export function swallowNextClick() {
    const swallow = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        cleanup()
    }
    const cleanup = () => {
        document.removeEventListener("click", swallow, true)
        window.clearTimeout(timer)
    }
    const timer = window.setTimeout(cleanup, 400)
    document.addEventListener("click", swallow, true)
}
