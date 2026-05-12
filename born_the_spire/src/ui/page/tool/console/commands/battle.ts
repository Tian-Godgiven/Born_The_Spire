import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import router from '@/ui/router'

export const battleCommands: ConsoleCommand[] = [
    {
        name: 'startBattle',
        group: '战斗',
        description: '立即开始战斗（支持多敌人）',
        usage: 'startBattle("enemy1", "enemy2"?, layer?)',
        examples: ['startBattle("test_enemy_slime")', 'startBattle("test_enemy_slime", "test_enemy_slime", 1)'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const enemyKeys: string[] = []
            let layer: number | undefined
            for (const arg of args) {
                if (typeof arg === 'string') enemyKeys.push(arg)
                else if (typeof arg === 'number') layer = arg
            }
            if (enemyKeys.length === 0) {
                addOutput('用法: startBattle("enemyKey1", "enemyKey2"?, layer?)', 'error')
                addOutput('使用 listEnemies() 查看所有敌人', 'info')
                return
            }
            try {
                const { BattleRoom } = await import('@/core/objects/room/BattleRoom')
                const { hasEnemy } = await import('@/static/list/target/enemyList')
                for (const key of enemyKeys) {
                    if (!hasEnemy(key)) {
                        addOutput(`未找到敌人: ${key}`, 'error')
                        return
                    }
                }
                const battleLayer = layer !== undefined ? layer : (nowGameRun.currentRoom?.layer || 1)
                addOutput(`准备与 ${enemyKeys.join(', ')} 战斗 (层级: ${battleLayer})`, 'info')
                if (nowGameRun.currentRoom) {
                    addOutput('退出当前房间...', 'info')
                    await nowGameRun.completeCurrentRoom()
                }
                const battleRoom = new BattleRoom({
                    type: 'battle',
                    layer: battleLayer,
                    battleType: 'normal',
                    enemyConfigs: enemyKeys
                })
                addOutput(`✓ 创建战斗房间成功 (${enemyKeys.length}个敌人)`, 'result')
                await nowGameRun.enterRoom(battleRoom)
                addOutput(`✓ 进入战斗房间`, 'result')
                await battleRoom.process()
                addOutput(`✓ 战斗开始！`, 'result')
                if (router.currentRoute.value.path !== '/running') {
                    router.replace('/running')
                }
            } catch (error: any) {
                addOutput(`开始战斗失败: ${error.message}`, 'error')
                console.error(error)
            }
        }
    },
    {
        name: 'listEnemies',
        group: '战斗',
        description: '列出所有敌人',
        usage: 'listEnemies()',
        execute: async (args, addOutput) => {
            try {
                const { enemyList } = await import('@/static/list/target/enemyList')
                if (!enemyList || enemyList.length === 0) {
                    addOutput('没有可用的敌人数据', 'info')
                    return
                }
                addOutput(`=== 共有 ${enemyList.length} 个可用敌人 ===`, 'info')
                for (const enemy of enemyList) {
                    const maxHealth = enemy.status?.['max-health'] || '?'
                    addOutput(`  [血量: ${maxHealth}] ${enemy.label} - ${enemy.key}`, 'result')
                }
                addOutput('', 'info')
                addOutput('使用 startBattle("enemyKey") 开始战斗', 'info')
            } catch (error: any) {
                addOutput(`列出敌人失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'dealDamage',
        group: '战斗',
        description: '测试造成伤害',
        usage: 'dealDamage(伤害)',
        examples: ['dealDamage(25)'],
        execute: async (args, addOutput) => {
            if (!nowPlayer) {
                addOutput('玩家不存在', 'error')
                return
            }
            const value = args[0]
            if (value === undefined || isNaN(value)) {
                addOutput('用法: dealDamage(伤害值)', 'error')
                addOutput('  例如: dealDamage(25)', 'info')
                return
            }
            try {
                const { doEvent } = await import('@/core/objects/system/ActionEvent')
                await doEvent({
                    key: 'testDamage',
                    source: nowPlayer,
                    medium: nowPlayer,
                    target: nowPlayer,
                    effectUnits: [{ key: 'damage', params: { value } }]
                })
                addOutput(`✓ 对玩家造成了 ${value} 点伤害`, 'result')
            } catch (error: any) {
                addOutput(`造成伤害失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'gameOver',
        group: '战斗',
        description: '触发游戏失败',
        usage: 'gameOver()',
        execute: async (args, addOutput) => {
            addOutput('触发游戏失败...', 'info')
            const { gameOver } = await import('@/core/hooks/game')
            await gameOver()
            addOutput('✓ 游戏失败已触发', 'result')
        }
    },
]
