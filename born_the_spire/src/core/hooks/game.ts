// 游戏流程相关的 hooks

import { nowGameRun, nowPlayer } from "@/core/objects/game/run"
import { doEvent } from "@/core/objects/system/ActionEvent"
import router from "@/ui/router"
import { newError } from "@/ui/hooks/global/alert"
import { newLog } from "@/ui/hooks/global/log"
import { RoomSelectRoom } from "@/core/objects/room/RoomSelectRoom"
import { roomRegistry } from "@/static/registry/roomRegistry"
import { DefeatRoom } from "@/core/objects/room/DefeatRoom"
import { VictoryRoom } from "@/core/objects/room/VictoryRoom"

/**
 * 进入失败房间
 *
 * 创建并进入 DefeatRoom，展示失败页面
 * @param defeatedBy 击败玩家的来源（敌人名称、事件名称等）
 */
export async function enterDefeatRoom(defeatedBy?: string) {
    const defeatRoom = new DefeatRoom({
        layer: nowGameRun.towerLevel,
        defeatedBy
    })

    await nowGameRun.enterRoom(defeatRoom)
    await defeatRoom.process()
}

/**
 * 进入通关房间
 */
export async function enterVictoryRoom() {
    const victoryRoom = new VictoryRoom({
        layer: nowGameRun.towerLevel
    })

    await nowGameRun.enterRoom(victoryRoom)
    await victoryRoom.process()
}

/**
 * 触发游戏失败
 *
 * 手动触发游戏失败流程，会：
 * 1. 杀死玩家
 * 2. 进入失败房间
 *
 * 用途：
 * - 控制台测试
 * - 特殊事件导致的游戏失败
 */
export async function gameOver(defeatedBy?: string) {
    if (!nowPlayer) {
        newError(["游戏未开始，无法触发游戏失败"])
        return
    }

    newLog(["触发游戏失败"])

    // 杀死玩家
    await doEvent({
        key: "kill",
        source: nowPlayer,
        medium: nowPlayer,
        target: nowPlayer,
        info: { reason: "游戏失败" },
        effectUnits: [{
            key: "kill",
            params: { reason: "游戏失败" }
        }]
    })

    // 进入失败房间
    await enterDefeatRoom(defeatedBy)
}

/**
 * 重试当前房间
 *
 * 重新开始当前房间（不只是战斗，事件也可能致死）
 * 会：
 * 1. 恢复玩家状态快照（回到进入房间前的状态）
 * 2. 退出当前房间
 * 3. 使用相同配置重新创建房间
 * 4. 进入新房间
 *
 * 注意：需要房间支持通过 key 重新创建
 */
export async function retryCurrentRoom() {
    const currentRoom = nowGameRun.currentRoom

    if (!currentRoom) {
        newError(["当前没有房间，无法重试"])
        return
    }

    newLog(["重试当前房间", currentRoom.getDisplayName()])

    // 保存房间信息
    const roomKey = currentRoom.__key
    const roomType = currentRoom.type
    const roomLayer = currentRoom.layer

    // 1. 恢复玩家状态快照
    const restored = await nowGameRun.restorePlayerSnapshot()
    if (!restored) {
        newError(["无法恢复玩家状态，重试失败"])
        return
    }

    // 2. 退出当前房间（不完成）
    await nowGameRun.exitCurrentRoom()

    // 3. 根据房间类型重新创建房间
    // 注意：这里假设房间可以通过 roomRegistry 重新创建
    // 如果房间是动态创建的（如 RoomSelectRoom），需要特殊处理
    try {
        if (roomType === "roomSelect") {
            // RoomSelectRoom 是动态创建的，需要特殊处理
            const newRoom = new RoomSelectRoom({
                type: "roomSelect",
                layer: roomLayer,
                targetLayer: roomLayer,
                roomCount: 3
            })
            await nowGameRun.enterRoom(newRoom)
            await newRoom.process()
        } else {
            // 其他房间类型通过 registry 重新创建
            const newRoom = roomRegistry.createRoom(roomKey, roomLayer)

            if (!newRoom) {
                newError(["无法重新创建房间", roomKey])
                return
            }

            await nowGameRun.enterRoom(newRoom)
            await newRoom.process()
        }

        newLog(["成功重试房间"])
    } catch (error) {
        newError(["重试房间失败", String(error)])
        console.error("[retryCurrentRoom] 错误:", error)
    }
}

/**
 * 重新开始一局新游戏
 *
 * 使用上一局的进阶等级开始新游戏
 */
export async function restartRun() {
    newLog(["重新开始游戏"])

    const ascensionLevel = nowGameRun.towerFire
    const { startNewRun } = await import("@/core/objects/game/run")
    await startNewRun(undefined, ascensionLevel)
}

/**
 * 返回主菜单
 *
 * 结束当前游戏，返回开始界面
 * 会：
 * 1. 清理当前游戏状态（可选）
 * 2. 跳转到主菜单路由
 */
export async function backToMainMenu() {
    newLog(["返回主菜单"])

    // 跳转到主菜单
    router.replace("/")

    // 注意：这里不清理游戏状态，因为用户可能想查看失败时的状态
    // 如果需要清理，可以调用 endRun() 或重置 nowGameRun
}
