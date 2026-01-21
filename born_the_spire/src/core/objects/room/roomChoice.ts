/**
 * 房间选择辅助函数
 * 用于创建房间选择的 ChoiceGroup
 */

import { Choice, ChoiceGroup } from "@/core/objects/system/Choice"
import { Room } from "@/core/objects/room/Room"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { nowGameRun } from "@/core/objects/game/run"

/**
 * 创建房间选择组
 * @param roomKeys 房间配置 key 列表
 * @param layer 层级
 * @param onRoomSelected 选择房间后的回调
 */
export function createRoomChoiceGroup(
    roomKeys: string[],
    layer: number,
    onRoomSelected?: (room: Room) => void | Promise<void>
): ChoiceGroup {
    // 创建房间实例
    const rooms = roomKeys
        .map(key => roomRegistry.createRoom(key, layer))
        .filter((room): room is Room => room !== null)

    // 创建选项
    const choices = rooms.map(room => {
        return new Choice({
            key: room.__key,
            title: room.getDisplayName(),
            description: room.description,
            icon: room.getIcon(),
            customData: { room },
            onSelect: async () => {
                // 选择房间后的逻辑
                if (onRoomSelected) {
                    await onRoomSelected(room)
                }
            }
        })
    })

    // 创建选项组
    return new ChoiceGroup({
        title: `选择第 ${layer} 层的房间`,
        description: "选择一个房间进入",
        choices,
        minSelect: 1,
        maxSelect: 1,
        onComplete: async (selected) => {
            const selectedChoice = selected[0]
            const room = selectedChoice.customData?.room as Room

            if (room) {
                // 进入房间
                await nowGameRun.value.enterRoom(room)
            }
        }
    })
}

/**
 * 生成随机房间选择
 * @param layer 层级
 * @param count 房间数量（默认 3）
 */
export function generateRandomRoomChoices(
    layer: number,
    count: number = 3
): ChoiceGroup {
    // TODO: 根据层级和概率规则生成房间
    // 这里先简单地从所有房间配置中随机选择

    const allConfigs = roomRegistry.getAllRoomConfigs()
    const shuffled = allConfigs.sort(() => Math.random() - 0.5)
    const selectedKeys = shuffled.slice(0, count).map(config => config.key)

    return createRoomChoiceGroup(selectedKeys, layer)
}
