/**
 * 事件自定义组件收到的 props。
 * EventRoom.vue 传给幕级整页组件、顶层插页、选项组件。
 * 结算 / 等待 / 换幕 / 离开都找 room 上的方法，不要另造一层。
 */

import type { EventMap, EventOptionMap, EventSceneMap } from "./EventMapData"
import type { Choice } from "@/core/objects/system/Choice"
import type { EventRoom } from "@/core/objects/room/EventRoom"

export type EventEffectUnit = {
    key: string
    params?: any
}

/**
 * 与选项链同一条结算/流程。组件演出结束后丢给 room.apply。
 * 只填 effects 时只结算、不换幕也不开地图。
 */
export interface EventSceneApplyOffer {
    saveData?: EventOptionMap["saveData"]
    effects?: EventEffectUnit[]
    rewards?: EventOptionMap["rewards"]
    customCallback?: EventOptionMap["customCallback"]
    nextScene?: string
    /** 只开地图，不锁选项（「无视他」） */
    openMap?: boolean
    /** 成交离开：锁选项并开地图 */
    leave?: boolean
}

export interface EventSceneProps {
    room: EventRoom
    event: EventMap
    scene?: EventSceneMap
    sceneData: Record<string, any>
    choices: Choice[]
    /** 只有选项上的 component 会带这个 */
    choice?: Choice
}
