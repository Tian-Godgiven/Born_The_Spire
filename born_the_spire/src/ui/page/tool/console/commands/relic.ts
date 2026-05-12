import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'

export const relicCommands: ConsoleCommand[] = [
    {
        name: 'listRelics',
        group: '遗物',
        description: '列出当前遗物',
        usage: 'listRelics()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            try {
                const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')
                const relicModifier = getRelicModifier(nowPlayer)
                const relics = relicModifier.getRelics()
                if (relics.length === 0) {
                    addOutput('当前没有拥有的遗物', 'info')
                    return
                }
                addOutput(`=== 当前拥有 ${relics.length} 个遗物 ===`, 'info')
                for (const relic of relics) {
                    addOutput(`  [${relic.rarity}] ${relic.label} (${relic.key}) __id: ${relic.__id}`, 'result')
                }
                addOutput('', 'info')
                addOutput('使用 removeRelic("key") 移除遗物', 'info')
            } catch (error: any) {
                addOutput(`列出遗物失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'listAllRelics',
        group: '遗物',
        description: '列出所有遗物',
        usage: 'listAllRelics()',
        execute: async (args, addOutput) => {
            try {
                const { getAllRelics } = await import('@/static/list/item/relicList')
                const allRelics = getAllRelics()
                if (!allRelics || allRelics.length === 0) {
                    addOutput('没有可用的遗物数据', 'info')
                    return
                }
                addOutput(`=== 共有 ${allRelics.length} 个可用遗物 ===`, 'info')
                for (const relic of allRelics) {
                    addOutput(`  [${relic.rarity || 'common'}] ${relic.label} - ${relic.key}`, 'result')
                }
                addOutput('', 'info')
                addOutput('使用 gainRelic("key") 获得遗物', 'info')
            } catch (error: any) {
                addOutput(`列出可用遗物失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'gainRelic',
        group: '遗物',
        description: '获得指定遗物',
        usage: 'gainRelic("key")',
        examples: ['gainRelic("original_relic_00001")'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const relicKey = args[0]
            if (!relicKey) {
                addOutput('用法: gainRelic("relicKey")', 'error')
                addOutput('使用 listAllRelics() 查看所有可用遗物', 'info')
                return
            }
            try {
                const { getRelicByKey } = await import('@/static/list/item/relicList')
                const { getRelic } = await import('@/core/objects/item/Subclass/Relic')
                const relic = await getRelicByKey(relicKey)
                getRelic(nowPlayer, nowPlayer, relic)
                addOutput(`✓ 成功获得遗物: ${relic.label} [${relic.rarity}]`, 'result')
            } catch (error: any) {
                addOutput(`获得遗物失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'removeRelic',
        group: '遗物',
        description: '移除指定遗物',
        usage: 'removeRelic("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const relicKey = args[0]
            if (!relicKey) {
                addOutput('用法: removeRelic("relicKeyOrId")', 'error')
                addOutput('使用 listRelics() 查看当前拥有的遗物', 'info')
                return
            }
            try {
                const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')
                const relicModifier = getRelicModifier(nowPlayer)
                const relic = relicModifier.getRelics().find(r => r.__id === relicKey) ?? relicModifier.getRelicByKey(relicKey)
                if (!relic) {
                    addOutput(`未拥有遗物: ${relicKey}`, 'error')
                    return
                }
                const relicName = relic.label
                relicModifier.loseRelic(relic)
                addOutput(`✓ 成功移除遗物: ${relicName}`, 'result')
            } catch (error: any) {
                addOutput(`移除遗物失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addRandomRelic',
        group: '遗物',
        description: '随机获取遗物',
        usage: 'addRandomRelic()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            try {
                const { getAllRelics } = await import('@/static/list/item/relicList')
                const { createRelic } = await import('@/core/factories')
                const { getRelic } = await import('@/core/objects/item/Subclass/Relic')
                const allRelics = getAllRelics()
                if (allRelics.length === 0) {
                    addOutput('没有可用的遗物', 'error')
                    return
                }
                const randomIndex = Math.floor(Math.random() * allRelics.length)
                const relicMap = allRelics[randomIndex]
                const relic = await createRelic(relicMap)
                getRelic(nowPlayer, nowPlayer, relic)
                addOutput(`✓ 成功获得随机遗物: ${relic.label} [${relic.rarity}]`, 'result')
                addOutput(`  key: ${relic.key}`, 'info')
            } catch (error: any) {
                addOutput(`获取随机遗物失败: ${error.message}`, 'error')
            }
        }
    },
]
