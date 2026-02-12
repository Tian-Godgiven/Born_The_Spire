import { GameRun } from "@/core/objects/system/GameRun";
import { Player } from "@/core/objects/target/Player";
import router from "@/ui/router";
import { reactive } from "vue";
import { addToPlayerTeam } from "./battle";
import type { Room } from "../room/Room";
import { getLazyModule } from "@/core/utils/lazyLoader";

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

        // 如果房间还没有确定具体的 roomKey（lazy 类型），现在分配
        if (!roomInstance.roomKey && (roomInstance as any).__mapNodeId) {
            const mapNode = nowGameRun.floorManager.getCurrentMap()?.getNode((roomInstance as any).__mapNodeId)
            if (mapNode && !mapNode.roomKey) {
                // 使用 MapGenerator 分配 lazy roomKey
                const generator = nowGameRun.floorManager.getMapGenerator()
                if (generator) {
                    const roomKey = generator.assignLazyRoomKey(mapNode)
                    mapNode.roomKey = roomKey
                    roomInstance.roomKey = roomKey
                }
            }
        }
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
    const playerList = getLazyModule<Record<string, any>>('playerList')
    const defaultPlayer = new Player(playerList["default"])
    nowPlayer = reactive(defaultPlayer) as unknown as Player

    const defaultGameRun = new GameRun()
    Object.assign(nowGameRun, defaultGameRun)

    // 调试：暴露到全局
    ;(window as any).nowPlayerDebug = nowPlayer

    // 暴露测试函数到全局
    ;(window as any).enterRoom = enterRoom
    ;(window as any).testEnterRoom = async (roomKey: string, layer: number = 1) => {
        await enterRoom(roomKey, layer)
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
            return
        }


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

    }

    // 触发游戏失败
    ;(window as any).gameOver = async () => {
        const { gameOver } = await import("@/core/hooks/game")
        await gameOver()
    }
}

//开始一局新游戏
export async function startNewRun(seed?: string){
    //创建本局（可选传入种子）
    const gameRun = new GameRun(seed)
    Object.assign(nowGameRun, gameRun)

    //创建本局角色
    const playerList = getLazyModule<Record<string, any>>('playerList')
    const map = playerList["default"]
    const player = new Player(map)
    nowPlayer = reactive(player) as unknown as Player  // 重新赋值，不要用 Object.assign

    //添加到队伍中
    addToPlayerTeam(nowPlayer)
    //跳转到游戏页面
    router.replace("running")

    // 确保所有房间类型已注册（通过导入触发自动注册）
    await import("@/core/objects/room/InitRoom")
    await import("@/core/objects/room/EventRoom")
    await import("@/core/objects/room/BattleRoom")
    await import("@/core/objects/room/PoolRoom")
    // await import("@/core/objects/room/BlackStoreRoom")
    await import("@/core/objects/room/RoomSelectRoom")
    await import("@/core/objects/room/FloorSelectRoom")
    await import("@/core/objects/room/TreasureRoom")

    // 设置当前层级为第1层（暂时，后续会让玩家选择）
    nowGameRun.floorManager.setCurrentFloor("floor_1")

    // 生成地图（使用 GameRun 的种子）
    console.log("[startNewRun] 生成地图，种子:", nowGameRun.seed)
    const floorMap = nowGameRun.floorManager.generateMap({
        seed: nowGameRun.seed,  // 传递种子
        // 前3层不出现精英战斗和水池
        layerSpecificWeights: {
            0: { battle: 1, eliteBattle: 0, event: 0, pool: 0, blackStore: 0 },      // 第1层：只有战斗
            1: { battle: 1, eliteBattle: 0, event: 0.2, pool: 0, blackStore: 0 },    // 第2层：战斗+少量事件
            2: { battle: 1, eliteBattle: 0, event: 0.2, pool: 0, blackStore: 0 },    // 第3层：战斗+少量事件
            // 第4层开始允许精英和水池
            3: { battle: 1, eliteBattle: 0.3, event: 0.3, pool: 0.5, blackStore: 0 },
            4: { battle: 1, eliteBattle: 0.3, event: 0.3, pool: 0.5, blackStore: 0 }
        }
    })
    console.log(`[startNewRun] 地图生成完成，共 ${floorMap.totalLayers} 层`)

    // 进入开场初始化房间（苏生）
    const { roomRegistry } = await import("@/static/registry/roomRegistry")
    const startEvent = roomRegistry.createRoom("init_game_start", 0)

    if (startEvent) {
        await nowGameRun.enterRoom(startEvent)

        // 等待事件完成后，显示地图UI
        const checkCompletion = setInterval(async () => {
            if (startEvent.isCompleted()) {
                clearInterval(checkCompletion)
                await nowGameRun.completeCurrentRoom()

                // 显示地图UI（通过回调）
                const { goToNextStep } = await import("@/core/hooks/step")
                await goToNextStep()
            }
        }, 100)
    }
}

//结束一局游戏，返回初始菜单
export function endRun(){
    router.replace("/")
}
