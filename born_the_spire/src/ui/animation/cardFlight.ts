import { markRaw, nextTick, ref, shallowRef } from "vue"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { settings } from "@/core/persistence/settings"
import { isAnimationCategoryEnabled } from "./categories"

export type CardPileName = "draw" | "hand" | "discard" | "exhaust"
export type CardPlayDestination = "discard" | "exhaust" | "none"

export interface CardFlightRect {
    left: number
    top: number
    width: number
    height: number
}

export interface CardFlightJob {
    id: string
    card: Card
    start: CardFlightRect
    hold: CardFlightRect | null
    end: CardFlightRect | null
    holdSec: number
    waitForFinish: boolean
    fromRot: number
    toRot: number
    scale: number
    vanish: boolean
    onHeld?: () => void
    onDone: () => void
}

const CARD_W = 130
const CARD_H = 200
const PLAY_HOLD_SEC = 0.18
/** 抽牌出发、进牌堆时的右倾角；入手/场中为 0 */
export const CARD_FLIGHT_TILT = 14

let seq = 0
let playCardId: string | null = null

export const hiddenHandCardIds = ref<string[]>([])
export const flightJobs = shallowRef<CardFlightJob[]>([])
/** 打出飞牌进行中。结束回合可以点，但会先等这个变 false 再真正结束。 */
export const playFlightActive = ref(false)

const playIdleWaiters: Array<() => void> = []

function setPlayFlightActive(active: boolean) {
    playFlightActive.value = active
    if (!active) {
        const waiters = playIdleWaiters.splice(0)
        waiters.forEach(fn => fn())
    }
}

export function waitForPlayFlightIdle(): Promise<void> {
    if (!playFlightActive.value) return Promise.resolve()
    return new Promise(resolve => { playIdleWaiters.push(resolve) })
}

export function cardFlightEnabled(): boolean {
    return settings.skipAnimation !== true && isAnimationCategoryEnabled("card")
}

export function isPlayFlight(cardId: string): boolean {
    return playCardId === cardId
}

function hideHand(id: string) {
    if (!hiddenHandCardIds.value.includes(id)) {
        hiddenHandCardIds.value = [...hiddenHandCardIds.value, id]
    }
}

function showHand(id: string) {
    hiddenHandCardIds.value = hiddenHandCardIds.value.filter(x => x !== id)
}

function pin(rect: DOMRect | CardFlightRect): CardFlightRect {
    return {
        left: rect.left + (rect.width - CARD_W) / 2,
        top: rect.top + (rect.height - CARD_H) / 2,
        width: CARD_W,
        height: CARD_H,
    }
}

export function queryPileRect(pile: CardPileName): CardFlightRect | null {
    const el = document.querySelector(`[data-card-pile="${pile}"]`)
    if (!(el instanceof HTMLElement)) return null
    return pin(el.getBoundingClientRect())
}

export function queryHandCardRect(cardId: string): CardFlightRect | null {
    const el = document.querySelector(`[data-hand-card-id="${cardId}"]`)
    if (!(el instanceof HTMLElement)) return null
    return pin(el.getBoundingClientRect())
}

function centerRect(): CardFlightRect {
    return {
        left: (window.innerWidth - CARD_W) / 2,
        top: (window.innerHeight - CARD_H) / 2 - 48,
        width: CARD_W,
        height: CARD_H,
    }
}

function fallbackRect(): CardFlightRect {
    return { left: window.innerWidth / 2, top: window.innerHeight - 80, width: CARD_W, height: CARD_H }
}

function pushJob(job: Omit<CardFlightJob, "id">): { id: string, promise: Promise<void> } {
    const id = `cf_${++seq}`
    const promise = new Promise<void>(resolve => {
        flightJobs.value = [
            ...flightJobs.value,
            {
                ...job,
                id,
                card: markRaw(job.card),
                onDone: () => {
                    job.onDone()
                    resolve()
                },
            },
        ]
    })
    return { id, promise }
}

export function completeFlightJob(id: string) {
    flightJobs.value = flightJobs.value.filter(job => job.id !== id)
}

const finishWaiters = new Map<string, (end: CardFlightRect | null) => void>()
const pendingEnds = new Map<string, CardFlightRect | null>()

export function waitForPlayFinish(jobId: string): Promise<CardFlightRect | null> {
    if (pendingEnds.has(jobId)) {
        const end = pendingEnds.get(jobId) ?? null
        pendingEnds.delete(jobId)
        return Promise.resolve(end)
    }
    return new Promise(resolve => {
        finishWaiters.set(jobId, resolve)
    })
}

export function setFlightJobEnd(id: string, end: CardFlightRect | null) {
    const waiter = finishWaiters.get(id)
    finishWaiters.delete(id)
    if (waiter) waiter(end)
    else pendingEnds.set(id, end)
}

function dummySession() {
    return {
        finish: async (_dest: CardPlayDestination) => {},
    }
}

/**
 * 打出：手牌飞到场中并停住。结算后再 finish 飞向弃牌/消耗堆。
 */
export async function beginCardPlay(card: Card): Promise<{ finish: (dest: CardPlayDestination) => Promise<void> }> {
    if (!cardFlightEnabled()) return dummySession()

    const start = queryHandCardRect(card.__id)
    if (!start) return dummySession()

    playCardId = card.__id
    setPlayFlightActive(true)
    hideHand(card.__id)

    let heldResolve: () => void
    const held = new Promise<void>(resolve => { heldResolve = resolve })

    const { id, promise } = pushJob({
        card,
        start,
        hold: centerRect(),
        end: null,
        holdSec: PLAY_HOLD_SEC,
        waitForFinish: true,
        fromRot: 0,
        toRot: 0,
        scale: 1,
        vanish: false,
        onHeld: () => heldResolve(),
        onDone: () => {
            showHand(card.__id)
            if (playCardId === card.__id) playCardId = null
            setPlayFlightActive(false)
        },
    })

    await held

    return {
        finish: async (dest: CardPlayDestination) => {
            const end = dest === "none" ? null : (queryPileRect(dest) ?? fallbackRect())
            setFlightJobEnd(id, end)
            await promise
        },
    }
}

/** 抽进手牌：从抽牌堆飞到该牌槽。不阻塞抽牌循环。 */
export function flyDrawnCard(card: Card): void {
    if (!cardFlightEnabled()) return
    hideHand(card.__id)
    const start = queryPileRect("draw") ?? fallbackRect()
    void nextTick().then(() => {
        const end = queryHandCardRect(card.__id) ?? queryPileRect("hand") ?? fallbackRect()
        void pushJob({
            card,
            start,
            hold: null,
            end,
            holdSec: 0,
            waitForFinish: false,
            fromRot: CARD_FLIGHT_TILT,
            toRot: 0,
            scale: 1,
            vanish: false,
            onDone: () => showHand(card.__id),
        })
    })
}

/** 手牌直接进弃牌/消耗堆（不是打出结算那一下） */
export function flyHandToPile(card: Card, dest: "discard" | "exhaust"): void {
    if (!cardFlightEnabled()) return
    if (isPlayFlight(card.__id)) return
    const start = queryHandCardRect(card.__id)
    if (!start) return
    hideHand(card.__id)
    const end = queryPileRect(dest) ?? fallbackRect()
    void pushJob({
        card,
        start,
        hold: null,
        end,
        holdSec: 0,
        waitForFinish: false,
        fromRot: 0,
        toRot: CARD_FLIGHT_TILT,
        scale: 1,
        vanish: true,
        onDone: () => showHand(card.__id),
    })
}
