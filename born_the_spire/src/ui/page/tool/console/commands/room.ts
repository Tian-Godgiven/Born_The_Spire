import type { ConsoleCommand, AddOutputFn } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { roomRegistry } from '@/static/registry/roomRegistry'
import router from '@/ui/router'

function ensureRunning(addOutput: AddOutputFn): boolean {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return false
    }
    return true
}

async function goToRunning() {
    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
}

export const roomCommands: ConsoleCommand[] = [
    {
        name: 'enterRoom',
        group: '房间',
        description: '进入指定房间',
        usage: 'enterRoom("key", layer?)',
        examples: ['enterRoom("battle_elite_hydra", 1)'],
        execute: async (args, addOutput) => {
            const [roomKey, layer = 1] = args
            if (!roomKey) {
                addOutput('用法: enterRoom(roomKey, layer?)', 'error')
                addOutput('例如: enterRoom("battle_normal_slime", 1)', 'info')
                return
            }
            addOutput(`尝试进入房间: ${roomKey}, 层级: ${layer}`, 'info')
            const room = roomRegistry.createRoom(roomKey, layer)
            if (!room) {
                addOutput(`创建房间失败: ${roomKey}`, 'error')
                addOutput('使用 listRooms() 查看所有可用房间', 'info')
                return
            }
            if (!ensureRunning(addOutput)) return
            await nowGameRun.enterRoom(room)
            addOutput(`✓ 成功进入房间: ${roomKey}`, 'result')
            await goToRunning()
        }
    },
    {
        name: 'listRooms',
        group: '房间',
        description: '列出所有房间',
        usage: 'listRooms()',
        examples: ['listRooms("battle")'],
        execute: (args, addOutput) => {
            const [type] = args
            const allRooms = roomRegistry.getAllRoomConfigs()
            const filtered = type ? allRooms.filter(r => r.type === type) : allRooms
            if (filtered.length === 0) {
                addOutput(type ? `没有找到类型为 "${type}" 的房间` : '没有可用的房间', 'info')
                return
            }
            addOutput(`找到 ${filtered.length} 个房间:`, 'info')
            filtered.forEach(room => {
                addOutput(`  [${room.type}] ${room.key} - ${room.name || '(无名称)'}`, 'result')
            })
            addOutput('', 'info')
            addOutput('使用 enterRoom("房间key") 进入房间', 'info')
        }
    },
    {
        name: 'unlockAllRooms',
        group: '房间',
        description: '解锁地图所有房间',
        usage: 'unlockAllRooms()',
        execute: (args, addOutput) => {
            if (!ensureRunning(addOutput)) return
            const floorMap = nowGameRun.floorManager.getCurrentMap()
            if (!floorMap) {
                addOutput('当前没有地图', 'error')
                return
            }
            floorMap.devMode = true
            const allNodes = floorMap.getAllNodes()
            let unlockedCount = 0
            for (const node of allNodes) {
                if (node.state === 'locked') {
                    node.state = 'available'
                    unlockedCount++
                }
            }
            addOutput(`✓ 已解锁 ${unlockedCount} 个房间`, 'result')
            addOutput('✓ 已启用开发模式（可自由移动到任何房间）', 'result')
            addOutput('现在可以在地图上点击任何房间进入', 'info')
        }
    },
    {
        name: 'listEvents',
        group: '事件',
        description: '列出所有事件',
        usage: 'listEvents()',
        execute: (args, addOutput) => {
            const allRooms = roomRegistry.getAllRoomConfigs()
            const events = allRooms.filter(r => r.type === 'event')
            if (events.length === 0) {
                addOutput('没有可用的事件', 'info')
                return
            }
            addOutput(`找到 ${events.length} 个事件:`, 'info')
            events.forEach(event => {
                addOutput(`  ${event.key} - ${event.name || '(无名称)'}`, 'result', `enterEvent("${event.key}")`)
            })
            addOutput('', 'info')
            addOutput('点击事件或使用 enterEvent("key") 进入事件', 'info')
        }
    },
    {
        name: 'enterEvent',
        group: '事件',
        description: '进入指定事件',
        usage: 'enterEvent("key")',
        examples: ['enterEvent("sts_event_big_fish")'],
        execute: async (args, addOutput) => {
            const [eventKey] = args
            if (!eventKey) {
                addOutput('用法: enterEvent("事件key")', 'error')
                addOutput('使用 listEvents() 查看所有事件', 'info')
                return
            }
            if (!ensureRunning(addOutput)) return
            const room = roomRegistry.createRoom(eventKey, nowGameRun.towerLevel || 1)
            if (!room) {
                addOutput(`创建事件房间失败: ${eventKey}`, 'error')
                addOutput('使用 listEvents() 查看所有可用事件', 'info')
                return
            }
            await nowGameRun.enterRoom(room)
            addOutput(`✓ 成功进入事件: ${eventKey}`, 'result')
            await goToRunning()
        }
    },
    {
        name: 'enterBlackStore',
        group: '黑市',
        description: '进入黑市',
        usage: 'enterBlackStore(layer?)',
        examples: ['enterBlackStore()', 'enterBlackStore(3)'],
        execute: async (args, addOutput) => {
            if (!ensureRunning(addOutput)) return
            const actualLayer = args[0] ?? nowGameRun.towerLevel ?? 1
            addOutput(`进入黑市，层级: ${actualLayer}`, 'info')
            const room = roomRegistry.createRoom("blackStore_default", actualLayer)
            if (!room) {
                addOutput('创建黑市房间失败，请确认黑市房间已注册', 'error')
                return
            }
            await nowGameRun.enterRoom(room)
            addOutput('✓ 成功进入黑市', 'result')
            await goToRunning()
        }
    },
    {
        name: 'enterPool',
        group: '水池',
        description: '进入水池',
        usage: 'enterPool(layer?)',
        examples: ['enterPool()', 'enterPool(3)'],
        execute: async (args, addOutput) => {
            if (!ensureRunning(addOutput)) return
            const actualLayer = args[0] ?? nowGameRun.towerLevel ?? 1
            addOutput(`进入水池，层级: ${actualLayer}`, 'info')
            const room = roomRegistry.createRoom("pool_default", actualLayer)
            if (!room) {
                addOutput('创建水池房间失败，请确认水池房间已注册', 'error')
                return
            }
            await nowGameRun.enterRoom(room)
            addOutput('✓ 成功进入水池', 'result')
            await goToRunning()
        }
    },
]
