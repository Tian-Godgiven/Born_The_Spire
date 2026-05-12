import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { getDescribe } from '@/ui/hooks/express/describe'

export const debugCommands: ConsoleCommand[] = [
    {
        name: 'listActiveAbilities',
        group: '主动',
        description: '列出主动能力',
        usage: 'listActiveAbilities()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const relicModifier = getRelicModifier(nowPlayer)
                const organs = organModifier.getOrgans()
                const relics = relicModifier.getRelics()
                let totalAbilities = 0

                addOutput('=== 当前拥有的主动能力 ===', 'info')
                addOutput('', 'info')

                addOutput('遗物:', 'info')
                for (const relic of relics) {
                    if (relic.activeAbilities && relic.activeAbilities.length > 0) {
                        addOutput(`  ${relic.label}:`, 'result')
                        for (const ability of relic.activeAbilities) {
                            addOutput(`    - ${ability.label}: ${getDescribe(ability.describe) || '无描述'}`, 'result')
                            totalAbilities++
                        }
                    }
                }

                addOutput('', 'info')
                addOutput('器官:', 'info')
                for (const organ of organs) {
                    if (organ.activeAbilities && organ.activeAbilities.length > 0) {
                        addOutput(`  ${organ.label}:`, 'result')
                        for (const ability of organ.activeAbilities) {
                            addOutput(`    - ${ability.label}: ${getDescribe(ability.describe) || '无描述'}`, 'result')
                            totalAbilities++
                        }
                    }
                }

                addOutput('', 'info')
                addOutput(`总计: ${totalAbilities} 个主动能力`, 'info')
                addOutput('右键点击对应的遗物或器官来使用主动能力', 'info')
            } catch (error: any) {
                addOutput(`获取主动能力失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addTestRelic',
        group: '调试',
        description: '添加测试遗物',
        usage: 'addTestRelic("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const relicKey = args[0]
            if (!relicKey) {
                addOutput('用法: addTestRelic("relicKey")', 'error')
                addOutput('可用测试遗物: testHealingPotion, testEnergyCore', 'info')
                return
            }
            try {
                const { testActiveAbilityItems } = await import('@/static/list/test/testActiveAbilityItems')
                const { createRelic } = await import('@/core/factories')
                const { getRelic } = await import('@/core/objects/item/Subclass/Relic')
                const relicMap = (testActiveAbilityItems as any)[relicKey]
                if (!relicMap) {
                    addOutput(`未找到测试遗物: ${relicKey}`, 'error')
                    addOutput('可用测试遗物: testHealingPotion, testEnergyCore', 'info')
                    return
                }
                const relic = await createRelic(relicMap)
                getRelic(nowPlayer, nowPlayer, relic)
                addOutput(`✓ 成功添加测试遗物: ${relic.label}`, 'result')
                if (relic.activeAbilities) {
                    addOutput(`  包含 ${relic.activeAbilities.length} 个主动能力`, 'info')
                }
            } catch (error: any) {
                addOutput(`添加测试遗物失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addTestOrgan',
        group: '调试',
        description: '添加测试器官',
        usage: 'addTestOrgan("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: addTestOrgan("organKey")', 'error')
                addOutput('可用测试器官: testEnhancedHeart', 'info')
                return
            }
            try {
                const { testActiveAbilityItems } = await import('@/static/list/test/testActiveAbilityItems')
                const { createOrgan } = await import('@/core/factories')
                const { getOrgan } = await import('@/core/objects/target/Organ')
                const organMap = (testActiveAbilityItems as any)[organKey]
                if (!organMap) {
                    addOutput(`未找到测试器官: ${organKey}`, 'error')
                    addOutput('可用测试器官: testEnhancedHeart', 'info')
                    return
                }
                const organ = await createOrgan(organMap)
                getOrgan(nowPlayer, nowPlayer, organ)
                addOutput(`✓ 成功添加测试器官: ${organ.label}`, 'result')
                if (organ.activeAbilities) {
                    addOutput(`  包含 ${organ.activeAbilities.length} 个主动能力`, 'info')
                }
            } catch (error: any) {
                addOutput(`添加测试器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'testOrganFlow',
        group: '调试',
        description: '器官系统自动化测试',
        usage: 'testOrganFlow()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            addOutput('=== 开始器官系统自动化测试 ===', 'info')
            addOutput('', 'info')
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const { getReserveModifier } = await import('@/core/objects/system/modifier/ReserveModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const reserveModifier = getReserveModifier(nowPlayer)

                addOutput('步骤1: 添加测试器官', 'info')
                const testOrganKey = 'original_organ_00001'
                reserveModifier.gainReserve('material', 100, nowPlayer)
                addOutput('  已添加 100 物质用于测试', 'result')

                const { getOrganByKey } = await import('@/static/list/target/organList')
                const organ = await getOrganByKey(testOrganKey)
                await organModifier.acquireOrgan(organ, nowPlayer)
                addOutput(`  ✓ 添加器官: ${organ.label}`, 'result')

                addOutput('', 'info')
                addOutput('步骤2: 升级器官', 'info')
                const oldLevel = organ.level
                const upgradeSuccess = await organModifier.upgradeOrgan(organ)
                addOutput(upgradeSuccess ? `  ✓ 升级成功: ${oldLevel} → ${organ.level}` : '  ⚠ 升级失败', upgradeSuccess ? 'result' : 'error')

                addOutput('', 'info')
                addOutput('步骤3: 损坏器官', 'info')
                const breakSuccess = organModifier.breakOrgan(organ)
                addOutput(breakSuccess ? '  ✓ 器官已损坏' : '  ⚠ 损坏失败', breakSuccess ? 'result' : 'error')

                addOutput('', 'info')
                addOutput('步骤4: 修复器官', 'info')
                reserveModifier.gainReserve('material', 50, nowPlayer)
                const repairSuccess = await organModifier.repairOrgan(organ)
                addOutput(repairSuccess ? '  ✓ 器官已修复' : '  ⚠ 修复失败', repairSuccess ? 'result' : 'error')

                addOutput('', 'info')
                addOutput('步骤5: 再次升级', 'info')
                const oldLevel2 = organ.level
                const upgradeSuccess2 = await organModifier.upgradeOrgan(organ)
                addOutput(upgradeSuccess2 ? `  ✓ 升级成功: ${oldLevel2} → ${organ.level}` : '  ⚠ 升级失败', upgradeSuccess2 ? 'result' : 'error')

                addOutput('', 'info')
                addOutput('步骤6: 吞噬器官', 'info')
                const organName = organ.label
                organModifier.devourOrgan(organ)
                addOutput(`  ✓ 器官已吞噬: ${organName}`, 'result')

                const remainingOrgans = organModifier.getOrgans()
                const stillHas = remainingOrgans.some((o: any) => o.key === testOrganKey)
                addOutput(stillHas ? '  ⚠ 器官仍在列表中' : '  ✓ 器官已从列表中移除', stillHas ? 'error' : 'result')

                addOutput('', 'info')
                addOutput('=== 器官系统自动化测试完成 ===', 'info')
            } catch (error: any) {
                addOutput(`测试失败: ${error.message}`, 'error')
                console.error(error)
            }
        }
    },
    {
        name: 'listTriggers',
        group: '调试',
        description: '列出玩家触发器',
        usage: 'listTriggers()',
        examples: ['listTriggers("enemy")', 'listTriggers({how:"take"})'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            let targetType: string = 'player'
            let filter: Record<string, string> | undefined
            const [firstArg, secondArg] = args
            if (typeof firstArg === 'string') {
                targetType = firstArg
                filter = secondArg
            } else if (typeof firstArg === 'object' && firstArg !== null) {
                filter = firstArg
            }
            try {
                const { getEntityTriggers, formatTriggerReport } = await import('@/core/hooks/triggerDebug')
                const outputReport = (entity: any) => {
                    const report = getEntityTriggers(entity)
                    const lines = formatTriggerReport(report, filter)
                    for (const line of lines) {
                        addOutput(line, 'result')
                    }
                }
                switch (targetType) {
                    case 'enemy':
                    case 'e': {
                        const { nowBattle } = await import('@/core/objects/game/battle')
                        const enemies = nowBattle?.value?.getTeam("enemy") ?? []
                        if (enemies.length === 0) {
                            addOutput('当前没有敌人', 'error')
                            return
                        }
                        for (const enemy of enemies) {
                            outputReport(enemy)
                            addOutput('', 'info')
                        }
                        return
                    }
                    case 'player':
                    case 'p':
                    default:
                        outputReport(nowPlayer)
                        break
                }
            } catch (error: any) {
                addOutput(`列出触发器失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'removeTrigger',
        group: '调试',
        description: '移除触发器',
        usage: 'removeTrigger("target", "id")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const [targetType, triggerId] = args
            if (!targetType || !triggerId) {
                addOutput('用法: removeTrigger("target", "triggerId")', 'error')
                addOutput('使用 listTriggers() 查看触发器 ID', 'info')
                return
            }
            try {
                const { removeTriggerById } = await import('@/core/hooks/triggerDebug')
                let entity: any
                switch (targetType) {
                    case 'enemy':
                    case 'e': {
                        const { nowBattle } = await import('@/core/objects/game/battle')
                        const enemies = nowBattle?.value?.getTeam("enemy") ?? []
                        if (enemies.length === 0) {
                            addOutput('当前没有敌人', 'error')
                            return
                        }
                        for (const enemy of enemies) {
                            const success = removeTriggerById(enemy, triggerId)
                            if (success) {
                                addOutput(`✓ 已从敌人 ${enemy.label} 移除触发器`, 'result')
                                return
                            }
                        }
                        addOutput(`未找到触发器: ${triggerId}`, 'error')
                        return
                    }
                    case 'player':
                    case 'p':
                    default:
                        entity = nowPlayer
                        break
                }
                const success = removeTriggerById(entity, triggerId)
                if (success) {
                    addOutput(`✓ 已移除触发器: ${triggerId}`, 'result')
                } else {
                    addOutput(`未找到触发器: ${triggerId}`, 'error')
                }
            } catch (error: any) {
                addOutput(`移除触发器失败: ${error.message}`, 'error')
            }
        }
    },
]
