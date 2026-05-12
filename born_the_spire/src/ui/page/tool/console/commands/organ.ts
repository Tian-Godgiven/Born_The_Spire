import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'

export const organCommands: ConsoleCommand[] = [
    {
        name: 'listOrgans',
        group: '器官',
        description: '列出当前器官',
        usage: 'listOrgans()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const organs = organModifier.getOrgans()
                if (organs.length === 0) {
                    addOutput('当前没有拥有的器官', 'info')
                    return
                }
                addOutput(`=== 当前拥有 ${organs.length} 个器官 ===`, 'info')
                addOutput('', 'info')
                for (const organ of organs) {
                    const status = organ.isDisabled ? '【损坏】' : '【正常】'
                    const level = `Lv.${organ.level}`
                    const rarity = organ.rarity
                    const part = organ.part ? `[${organ.part}]` : ''
                    addOutput(`  ${status} ${level} [${rarity}]${part} ${organ.label} (${organ.key})`, 'result')
                }
                addOutput('', 'info')
                addOutput('使用 addOrgan("key") 添加器官', 'info')
                addOutput('使用 breakOrgan("key") 损坏器官', 'info')
                addOutput('使用 repairOrgan("key") 修复器官', 'info')
                addOutput('使用 upgradeOrgan("key") 升级器官', 'info')
                addOutput('使用 removeOrgan("key") 移除器官', 'info')
            } catch (error: any) {
                addOutput(`列出器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'listAllOrgans',
        group: '器官',
        description: '列出所有器官',
        usage: 'listAllOrgans()',
        execute: async (args, addOutput) => {
            try {
                const { organList } = await import('@/static/list/target/organList')
                if (!organList || organList.length === 0) {
                    addOutput('没有可用的器官数据', 'info')
                    return
                }
                addOutput(`=== 共有 ${organList.length} 个可用器官 ===`, 'info')
                addOutput('', 'info')
                for (const organ of organList) {
                    const rarity = organ.rarity || 'common'
                    const part = organ.part ? `[${organ.part}]` : ''
                    addOutput(`  [${rarity}]${part} ${organ.label} - ${organ.key}`, 'result')
                }
                addOutput('', 'info')
                addOutput('使用 addOrgan("key") 添加器官到玩家', 'info')
            } catch (error: any) {
                addOutput(`列出可用器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addOrgan',
        group: '器官',
        description: '添加器官',
        usage: 'addOrgan("key")',
        examples: ['addOrgan("original_organ_00001")'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: addOrgan("organKey")', 'error')
                addOutput('使用 listAllOrgans() 查看所有可用器官', 'info')
                return
            }
            try {
                const { getOrganByKey } = await import('@/static/list/target/organList')
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organ = await getOrganByKey(organKey)
                const organModifier = getOrganModifier(nowPlayer)
                await organModifier.acquireOrgan(organ, nowPlayer)
                addOutput(`✓ 成功添加器官: ${organ.label}`, 'result')
            } catch (error: any) {
                addOutput(`添加器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'breakOrgan',
        group: '器官',
        description: '损坏器官',
        usage: 'breakOrgan("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: breakOrgan("organKey")', 'error')
                addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const organ = organModifier.getOrganByKey(organKey)
                if (!organ) {
                    addOutput(`未拥有器官: ${organKey}`, 'error')
                    return
                }
                const success = organModifier.breakOrgan(organ)
                if (success) {
                    addOutput(`✓ 成功损坏器官: ${organ.label}`, 'result')
                } else {
                    addOutput(`损坏器官失败（可能已损坏或有坚固词条）`, 'error')
                }
            } catch (error: any) {
                addOutput(`损坏器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'repairOrgan',
        group: '器官',
        description: '修复器官',
        usage: 'repairOrgan("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: repairOrgan("organKey")', 'error')
                addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const organ = organModifier.getOrganByKey(organKey)
                if (!organ) {
                    addOutput(`未拥有器官: ${organKey}`, 'error')
                    return
                }
                const success = await organModifier.repairOrgan(organ)
                if (success) {
                    addOutput(`✓ 成功修复器官: ${organ.label}`, 'result')
                } else {
                    addOutput(`修复器官失败（可能未损坏或物质不足）`, 'error')
                }
            } catch (error: any) {
                addOutput(`修复器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'upgradeOrgan',
        group: '器官',
        description: '升级器官',
        usage: 'upgradeOrgan("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: upgradeOrgan("organKey")', 'error')
                addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const organ = organModifier.getOrganByKey(organKey)
                if (!organ) {
                    addOutput(`未拥有器官: ${organKey}`, 'error')
                    return
                }
                const oldLevel = organ.level
                const success = await organModifier.upgradeOrgan(organ)
                if (success) {
                    addOutput(`✓ 成功升级器官: ${organ.label} (${oldLevel} → ${organ.level})`, 'result')
                } else {
                    addOutput(`升级器官失败（可能已损坏、已达最大等级或资源不足）`, 'error')
                }
            } catch (error: any) {
                addOutput(`升级器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'removeOrgan',
        group: '器官',
        description: '吞噬器官',
        usage: 'removeOrgan("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            if (!organKey) {
                addOutput('用法: removeOrgan("organKey")', 'error')
                addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
                return
            }
            try {
                const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
                const organModifier = getOrganModifier(nowPlayer)
                const organ = organModifier.getOrganByKey(organKey)
                if (!organ) {
                    addOutput(`未拥有器官: ${organKey}`, 'error')
                    return
                }
                const organName = organ.label
                organModifier.devourOrgan(organ)
                addOutput(`✓ 成功吞噬器官: ${organName}`, 'result')
            } catch (error: any) {
                addOutput(`移除器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'unlockAllOrgans',
        group: '器官',
        description: '解锁所有器官（图鉴）',
        usage: 'unlockAllOrgans()',
        execute: async (args, addOutput) => {
            const { getLazyModule } = await import('@/core/utils/lazyLoader')
            const { loadMetaProgress, saveMetaProgress, unlockOrgan } = await import('@/core/persistence/metaProgress')
            const organList = getLazyModule<any[]>('organList')
            const metaProgress = loadMetaProgress()
            let unlockedCount = 0
            for (const organData of organList) {
                const isNew = unlockOrgan(metaProgress, organData.key)
                if (isNew) unlockedCount++
            }
            saveMetaProgress(metaProgress)
            addOutput(`✓ 已解锁所有器官`, 'result')
            addOutput(`  新解锁: ${unlockedCount} 个`, 'info')
            addOutput(`  总计: ${organList.length} 个`, 'info')
        }
    },
]
