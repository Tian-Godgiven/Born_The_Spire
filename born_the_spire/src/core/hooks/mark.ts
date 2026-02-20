/**
 * 印记工具函数
 * 提供印记相关的高级操作
 */

import type { Player } from "@/core/objects/target/Player"
import { markRegistry } from "@/static/registry/markRegistry"
import { ensureStatusExists, changeStatusValue, getStatusValue } from "@/core/objects/system/status/Status"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 玩家获得印记
 * @param player 玩家
 * @param markKey 印记key
 */
export function gainMark(player: Player, markKey: string): void {
    const mark = markRegistry.getMark(markKey)

    if (!mark) {
        console.error(`[gainMark] 未找到印记: ${markKey}`)
        return
    }

    // 检查是否已经拥有该印记
    if (getStatusValue(player, mark.statusKey, 0) === 1) {
        newLog([`已经拥有 ${mark.name}`])
        return
    }

    // 设置印记状态
    ensureStatusExists(player, mark.statusKey, 0)
    changeStatusValue(player, mark.statusKey, player, {
        target: "base",
        type: "additive",
        value: 1
    })

    // 触发 onGain 效果
    if (mark.onGain) {
        doEvent({
            key: mark.onGain.key,
            source: player,
            medium: player,
            target: player,
            effectUnits: mark.onGain.effectUnits
        })
    }

    newLog([`获得了 ${mark.name}！`])
}

/**
 * 检查玩家是否拥有印记
 * @param player 玩家
 * @param markKey 印记key
 */
export function hasMark(player: Player, markKey: string): boolean {
    const mark = markRegistry.getMark(markKey)

    if (!mark) {
        return false
    }

    return getStatusValue(player, mark.statusKey, 0) === 1
}

/**
 * 获取玩家拥有的所有印记
 * @param player 玩家
 */
export function getPlayerMarks(player: Player): string[] {
    const marks: string[] = []

    for (const mark of markRegistry.getAllMarks()) {
        if (getStatusValue(player, mark.statusKey, 0) === 1) {
            marks.push(mark.key)
        }
    }

    return marks
}

/**
 * 获取玩家拥有的印记数量
 * @param player 玩家
 */
export function countPlayerMarks(player: Player): number {
    return getPlayerMarks(player).length
}
