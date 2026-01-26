import { GameRun } from "@/core/objects/system/GameRun";
import { Player } from "@/core/objects/target/Player";
import router from "@/ui/router";
import { playerList } from "@/static/list/target/playerList";
import { reactive } from "vue";
import { addToPlayerTeam } from "./battle";
import type { Room } from "../room/Room";

//当前的局（使用 reactive 包装，内部属性自动响应式）
export const nowGameRun = reactive<GameRun>(new GameRun())

// 当前玩家（初始化为 null，在 initDefaultGameObjects 中创建）
export let nowPlayer: Player = null as any

/**
 * 进入指定房间（独立函数，可在控制台调用）
 * @param room - Room 实例或房间 key
 * @param layer - 如果传入 key，需要指定层级
 */
export async function enterRoom(room: Room | string, layer?: number): Promise<void> {
    if (!nowGameRun) {
        console.error('[enterRoom] 游戏未开始，请先点击"开始游戏"')
        return
    }

    let roomInstance: Room | null = null

    // 如果传入的是字符串 key，创建房间实例
    if (typeof room === 'string') {
        if (layer === undefined) {
            console.error('[enterRoom] 使用房间 key 时必须提供 layer 参数')
            return
        }

        const { roomRegistry } = await import("@/static/registry/roomRegistry")
        roomInstance = roomRegistry.createRoom(room, layer)

        if (!roomInstance) {
            console.error(`[enterRoom] 创建房间失败: ${room}`)
            return
        }
    } else {
        roomInstance = room
    }

    // 进入房间
    await nowGameRun.enterRoom(roomInstance)

    // 处理房间内容
    await roomInstance.process()

    // 如果不在 running 页面，跳转过去
    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
}

// 初始化函数，在懒加载完成后调用
export function initDefaultGameObjects() {
    // nowPlayer 已经在模块初始化时创建，这里只需要重新赋值
    const defaultPlayer = new Player(playerList["default"])
    nowPlayer = reactive(defaultPlayer) as unknown as Player

    const defaultGameRun = new GameRun()
    Object.assign(nowGameRun, defaultGameRun)

    // 调试：暴露到全局
    ;(window as any).nowPlayerDebug = nowPlayer

    // 暴露测试函数到全局
    ;(window as any).enterRoom = enterRoom
    ;(window as any).testEnterRoom = async (roomKey: string, layer: number = 1) => {
        console.log(`[Test] 尝试进入房间: ${roomKey}, 层级: ${layer}`)
        await enterRoom(roomKey, layer)
        console.log(`[Test] 成功进入房间: ${roomKey}`)
    }

    // 列出所有可用房间
    ;(window as any).listRooms = async (type?: string) => {
        const { roomRegistry } = await import("@/static/registry/roomRegistry")
        const allRooms = roomRegistry.getAllRoomConfigs()

        if (type) {
            const filtered = allRooms.filter(r => r.type === type)
            console.table(filtered.map(r => ({ key: r.key, type: r.type, name: r.name })))
        } else {
            console.table(allRooms.map(r => ({ key: r.key, type: r.type, name: r.name })))
        }

        return allRooms
    }

    // 杀死当前战斗中的所有敌人
    ;(window as any).killAllEnemies = async () => {
        const { nowBattle } = await import("@/core/objects/game/battle")
        if (!nowBattle.value) {
            console.error('[killAllEnemies] 当前没有战斗')
            return
        }

        const enemies = nowBattle.value.getAliveEnemies()
        if (enemies.length === 0) {
            console.log('[killAllEnemies] 没有存活的敌人')
            return
        }

        console.log(`[killAllEnemies] 杀死 ${enemies.length} 个敌人`)

        const { doEvent } = await import("@/core/objects/system/ActionEvent")
        for (const enemy of enemies) {
            await doEvent({
                key: "kill",
                source: nowPlayer,
                medium: nowPlayer,
                target: enemy,
                info: { reason: "控制台命令" },
                effectUnits: [{
                    key: "kill",
                    params: { reason: "控制台命令" }
                }]
            })
        }

        console.log('[killAllEnemies] 所有敌人已被杀死')
    }

    console.log('[Debug] 测试函数已暴露到全局:')
    console.log('  - enterRoom(roomKey, layer) - 进入指定房间（独立函数）')
    console.log('  - testEnterRoom(roomKey, layer?) - 进入指定房间（带日志）')
    console.log('  - listRooms(type?) - 列出所有房间（可选按类型筛选）')
    console.log('  - killAllEnemies() - 杀死当前战斗中的所有敌人')
    console.log('  例如: enterRoom("battle_normal_slime", 1)')
    console.log('  例如: testEnterRoom("battle_normal_slime", 1)')
    console.log('  例如: listRooms("battle")')
    console.log('  例如: killAllEnemies()')
}

//开始一局新游戏
export async function startNewRun(){
    //创建本局
    const gameRun = new GameRun()
    Object.assign(nowGameRun, gameRun)

    //创建本局角色
    const map = playerList["default"]
    const player = new Player(map)
    nowPlayer = reactive(player) as unknown as Player  // 重新赋值，不要用 Object.assign

    //添加到队伍中
    addToPlayerTeam(nowPlayer)
    //跳转到游戏页面
    router.replace("running")

    // 确保所有房间类型已注册（通过导入触发自动注册）
    await import("@/core/objects/room/EventRoom")
    await import("@/core/objects/room/BattleRoom")
    await import("@/core/objects/room/PoolRoom")
    await import("@/core/objects/room/BlackStoreRoom")
    await import("@/core/objects/room/RoomSelectRoom")

    // 进入开场事件
    const { roomRegistry } = await import("@/static/registry/roomRegistry")
    const startEvent = roomRegistry.createRoom("event_game_start", 0)

    if (startEvent) {
        await nowGameRun.enterRoom(startEvent)

        // 等待事件完成后，进入房间选择
        const checkCompletion = setInterval(async () => {
            if (startEvent.isCompleted()) {
                clearInterval(checkCompletion)
                await nowGameRun.completeCurrentRoom()

                // 创建房间选择房间（动态创建，不使用预注册的配置）
                const { RoomSelectRoom } = await import("@/core/objects/room/RoomSelectRoom")
                const roomSelectRoom = new RoomSelectRoom({
                    type: "roomSelect",
                    layer: 1,
                    targetLayer: 1,
                    roomCount: 3
                })

                if (roomSelectRoom) {
                    await nowGameRun.enterRoom(roomSelectRoom)
                }
            }
        }, 100)
    }
}

//结束一局游戏，返回初始菜单
export function endRun(){
    router.replace("/")
}
