<template>
<div class="console-panel" v-if="isVisible">
    <div class="header">
        <span>开发者控制台</span>
        <button @click="close">×</button>
    </div>
    <div class="output" ref="outputRef">
        <div v-for="(line, index) in outputLines" :key="index" class="output-line">
            <span v-if="line.type === 'command'" class="prompt">&gt; </span>
            <span :class="['text', line.type]">{{ line.text }}</span>
        </div>
    </div>
    <div class="input-area">
        <span class="prompt">&gt; </span>
        <input
            ref="inputRef"
            v-model="currentInput"
            @keydown.enter="executeCommand"
            @keydown.up="historyUp"
            @keydown.down="historyDown"
            placeholder="输入命令... (输入 help 查看帮助)"
        />
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { roomRegistry } from '@/static/registry/roomRegistry'
import router from '@/ui/router'

interface OutputLine {
    type: 'command' | 'result' | 'error' | 'info'
    text: string
}

const isVisible = ref(false)
const currentInput = ref('')
const outputLines = ref<OutputLine[]>([])
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)
const outputRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

// 添加输出行
function addOutput(text: string, type: OutputLine['type'] = 'result') {
    outputLines.value.push({ type, text })
    nextTick(() => {
        if (outputRef.value) {
            outputRef.value.scrollTop = outputRef.value.scrollHeight
        }
    })
}

// 执行命令
async function executeCommand() {
    const command = currentInput.value.trim()
    if (!command) return

    // 显示命令
    addOutput(command, 'command')

    // 添加到历史
    commandHistory.value.push(command)
    historyIndex.value = commandHistory.value.length

    // 清空输入
    currentInput.value = ''

    // 解析并执行命令
    try {
        await parseAndExecute(command)
    } catch (error: any) {
        addOutput(`错误: ${error.message}`, 'error')
    }
}

// 解析并执行命令
async function parseAndExecute(command: string) {
    // 简单的命令解析
    const match = command.match(/^(\w+)\s*\(([^)]*)\)$/)

    if (match) {
        const [, funcName, argsStr] = match
        const args = argsStr ? argsStr.split(',').map(s => {
            s = s.trim()
            // 移除引号
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
                return s.slice(1, -1)
            }
            // 尝试解析为数字
            const num = Number(s)
            return isNaN(num) ? s : num
        }) : []

        await executeFunction(funcName, args)
    } else if (command === 'help') {
        showHelp()
    } else if (command === 'clear') {
        outputLines.value = []
    } else {
        addOutput(`未知命令: ${command}`, 'error')
        addOutput('输入 help 查看帮助', 'info')
    }
}

// 执行函数
async function executeFunction(funcName: string, args: any[]) {
    switch (funcName) {
        case 'enterRoom':
            await enterRoom(args[0], args[1] || 1)
            break
        case 'listRooms':
            listRooms(args[0])
            break
        case 'gameOver':
            await triggerGameOver()
            break
        case 'unlockAllRooms':
            unlockAllRooms()
            break
        case 'addTempCard':
            await addTemporaryCard(args[0], args[1] || 'battleEnd')
            break
        case 'addTempOrgan':
            await addTemporaryOrgan(args[0], args[1] || 'battleEnd')
            break
        case 'listTempItems':
            listTemporaryItems()
            break
        case 'addTestRelic':
            await addTestRelic(args[0])
            break
        case 'addTestOrgan':
            await addTestOrgan(args[0])
            break
        case 'listActiveAbilities':
            listActiveAbilities()
            break
        case 'listOrgans':
            listOrgans()
            break
        case 'listAllOrgans':
            listAllOrgans()
            break
        case 'addOrgan':
            await addOrgan(args[0])
            break
        case 'breakOrgan':
            await breakOrgan(args[0])
            break
        case 'repairOrgan':
            await repairOrgan(args[0])
            break
        case 'upgradeOrgan':
            await upgradeOrgan(args[0])
            break
        case 'removeOrgan':
            await removeOrgan(args[0])
            break
        case 'testOrganFlow':
            await testOrganFlow()
            break
        case 'listTriggers':
            listTriggers(args[0])
            break
        case 'removeTrigger':
            await removeTrigger(args[0], args[1])
            break
        case 'unlockAllOrgans':
            await unlockAllOrgans()
            break
        case 'help':
            showHelp()
            break
        case 'clear':
            outputLines.value = []
            break
        default:
            addOutput(`未知函数: ${funcName}`, 'error')
            addOutput('输入 help 查看可用命令', 'info')
    }
}

// 进入房间
async function enterRoom(roomKey: string, layer: number = 1) {
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

    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    await nowGameRun.enterRoom(room)
    addOutput(`✓ 成功进入房间: ${roomKey}`, 'result')

    // 如果不在 running 页面，跳转过去
    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
}

// 列出所有房间
function listRooms(type?: string) {
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

// 触发游戏失败
async function triggerGameOver() {
    addOutput('触发游戏失败...', 'info')

    const { gameOver } = await import('@/core/hooks/game')
    await gameOver()

    addOutput('✓ 游戏失败已触发', 'result')
}

// 解锁所有房间
function unlockAllRooms() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    const floorMap = nowGameRun.floorManager.getCurrentMap()
    if (!floorMap) {
        addOutput('当前没有地图', 'error')
        return
    }

    // 启用开发模式
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

// 添加临时卡牌
async function addTemporaryCard(cardKey: string, removeOn: string = 'battleEnd') {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!cardKey) {
        addOutput('用法: addTempCard("cardKey", "removeOn")', 'error')
        addOutput('例如: addTempCard("original_card_00001", "battleEnd")', 'info')
        addOutput('移除时机: battleEnd, turnEnd, floorEnd', 'info')
        return
    }

    try {
        const { addTemporaryCard: addTempCard } = await import('@/core/hooks/temporary')
        const player = nowPlayer

        const card = await addTempCard(cardKey, player, removeOn as any)
        addOutput(`✓ 成功添加临时卡牌: ${card.label} (${removeOn})`, 'result')
    } catch (error: any) {
        addOutput(`添加临时卡牌失败: ${error.message}`, 'error')
    }
}

// 添加临时器官
async function addTemporaryOrgan(organKey: string, removeOn: string = 'battleEnd') {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: addTempOrgan("organKey", "removeOn")', 'error')
        addOutput('例如: addTempOrgan("original_organ_00001", "battleEnd")', 'info')
        addOutput('移除时机: battleEnd, turnEnd, floorEnd', 'info')
        return
    }

    try {
        const { addTemporaryOrgan: addTempOrgan } = await import('@/core/hooks/temporary')
        const player = nowPlayer

        const organ = await addTempOrgan(organKey, player, removeOn as any)
        addOutput(`✓ 成功添加临时器官: ${organ.label} (${removeOn})`, 'result')
    } catch (error: any) {
        addOutput(`添加临时器官失败: ${error.message}`, 'error')
    }
}

// 列出所有临时物品
function listTemporaryItems() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const { getAllTemporaryItems } = require('@/core/hooks/temporary')
        const tempItems = getAllTemporaryItems()

        if (tempItems.length === 0) {
            addOutput('当前没有临时物品', 'info')
            return
        }

        addOutput(`找到 ${tempItems.length} 个临时物品:`, 'info')
        tempItems.forEach((item: any) => {
            const type = item.itemType === 'card' ? '卡牌' : '器官'
            addOutput(`  [${type}] ${item.label} - 移除时机: ${item.temporaryRemoveOn}`, 'result')
        })
    } catch (error: any) {
        addOutput(`获取临时物品失败: ${error.message}`, 'error')
    }
}

// 添加测试遗物
async function addTestRelic(relicKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

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
        const player = nowPlayer
        getRelic(player, player, relic)

        addOutput(`✓ 成功添加测试遗物: ${relic.label}`, 'result')
        if (relic.activeAbilities) {
            addOutput(`  包含 ${relic.activeAbilities.length} 个主动能力`, 'info')
        }
    } catch (error: any) {
        addOutput(`添加测试遗物失败: ${error.message}`, 'error')
    }
}

// 添加测试器官
async function addTestOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

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
        const player = nowPlayer
        getOrgan(player, player, organ)

        addOutput(`✓ 成功添加测试器官: ${organ.label}`, 'result')
        if (organ.activeAbilities) {
            addOutput(`  包含 ${organ.activeAbilities.length} 个主动能力`, 'info')
        }
    } catch (error: any) {
        addOutput(`添加测试器官失败: ${error.message}`, 'error')
    }
}

// 列出当前拥有的主动能力
function listActiveAbilities() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const player = nowPlayer
        const { getOrganModifier } = require('@/core/objects/system/modifier/OrganModifier')
        const { getRelicModifier } = require('@/core/objects/system/modifier/RelicModifier')

        const organModifier = getOrganModifier(player)
        const relicModifier = getRelicModifier(player)

        const organs = organModifier.getOwnedOrgans()
        const relics = relicModifier.getOwnedRelics()

        let totalAbilities = 0

        addOutput('=== 当前拥有的主动能力 ===', 'info')
        addOutput('', 'info')

        // 遗物的主动能力
        addOutput('遗物:', 'info')
        for (const relic of relics) {
            if (relic.activeAbilities && relic.activeAbilities.length > 0) {
                addOutput(`  ${relic.label}:`, 'result')
                for (const ability of relic.activeAbilities) {
                    addOutput(`    - ${ability.label}: ${ability.description || '无描述'}`, 'result')
                    totalAbilities++
                }
            }
        }

        // 器官的主动能力
        addOutput('', 'info')
        addOutput('器官:', 'info')
        for (const organ of organs) {
            if (organ.activeAbilities && organ.activeAbilities.length > 0) {
                addOutput(`  ${organ.label}:`, 'result')
                for (const ability of organ.activeAbilities) {
                    addOutput(`    - ${ability.label}: ${ability.description || '无描述'}`, 'result')
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

// 列出玩家当前拥有的器官
function listOrgans() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const player = nowPlayer
        const { getOrganModifier } = require('@/core/objects/system/modifier/OrganModifier')
        const organModifier = getOrganModifier(player)
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

// 列出所有可用器官（从配置）
function listAllOrgans() {
    try {
        const organList = (require('@/static/list/target/organList')).organList

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

// 添加器官
async function addOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: addOrgan("organKey")', 'error')
        addOutput('例如: addOrgan("original_organ_00001")', 'info')
        addOutput('使用 listAllOrgans() 查看所有可用器官', 'info')
        return
    }

    try {
        const { getOrganByKey } = await import('@/static/list/target/organList')
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')

        const organ = await getOrganByKey(organKey)
        const player = nowPlayer
        const organModifier = getOrganModifier(player)

        await organModifier.acquireOrgan(organ, player)
        addOutput(`✓ 成功添加器官: ${organ.label}`, 'result')

    } catch (error: any) {
        addOutput(`添加器官失败: ${error.message}`, 'error')
    }
}

// 损坏器官
async function breakOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: breakOrgan("organKey")', 'error')
        addOutput('例如: breakOrgan("original_organ_00001")', 'info')
        addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
        return
    }

    try {
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const player = nowPlayer
        const organModifier = getOrganModifier(player)

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

// 修复器官
async function repairOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: repairOrgan("organKey")', 'error')
        addOutput('例如: repairOrgan("original_organ_00001")', 'info')
        addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
        return
    }

    try {
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const player = nowPlayer
        const organModifier = getOrganModifier(player)

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

// 升级器官
async function upgradeOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: upgradeOrgan("organKey")', 'error')
        addOutput('例如: upgradeOrgan("original_organ_00001")', 'info')
        addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
        return
    }

    try {
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const player = nowPlayer
        const organModifier = getOrganModifier(player)

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

// 移除器官（吞噬）
async function removeOrgan(organKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!organKey) {
        addOutput('用法: removeOrgan("organKey")', 'error')
        addOutput('例如: removeOrgan("original_organ_00001")', 'info')
        addOutput('使用 listOrgans() 查看当前拥有的器官', 'info')
        return
    }

    try {
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const player = nowPlayer
        const organModifier = getOrganModifier(player)

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

// 自动化测试器官流程
async function testOrganFlow() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    addOutput('=== 开始器官系统自动化测试 ===', 'info')
    addOutput('', 'info')

    try {
        const { Organ } = await import('@/core/objects/target/Organ')
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const { getReserveModifier } = await import('@/core/objects/system/modifier/ReserveModifier')
        const organList = (await import('@/static/list/target/organList')).organList
        const player = nowPlayer
        const organModifier = getOrganModifier(player)
        const reserveModifier = getReserveModifier(player)

        // 步骤1: 添加测试器官
        addOutput('步骤1: 添加测试器官', 'info')
        const testOrganKey = 'original_organ_00001'  // 心脏器官

        // 确保物质充足
        reserveModifier.gainReserve('material', 100, player)
        addOutput('  已添加 100 物质用于测试', 'result')

        const { getOrganByKey } = await import('@/static/list/target/organList')
        const organ = await getOrganByKey(testOrganKey)
        await organModifier.acquireOrgan(organ, player)
        addOutput(`  ✓ 添加器官: ${organ.label}`, 'result')

        // 步骤2: 升级器官
        addOutput('', 'info')
        addOutput('步骤2: 升级器官', 'info')
        const oldLevel = organ.level
        const upgradeSuccess = await organModifier.upgradeOrgan(organ)
        if (upgradeSuccess) {
            addOutput(`  ✓ 升级成功: ${oldLevel} → ${organ.level}`, 'result')
        } else {
            addOutput(`  ⚠ 升级失败（可能已达最大等级）`, 'error')
        }

        // 步骤3: 损坏器官
        addOutput('', 'info')
        addOutput('步骤3: 损坏器官', 'info')
        const breakSuccess = organModifier.breakOrgan(organ)
        if (breakSuccess) {
            addOutput(`  ✓ 器官已损坏`, 'result')
        } else {
            addOutput(`  ⚠ 损坏失败（可能已损坏或有坚固词条）`, 'error')
        }

        // 步骤4: 修复器官
        addOutput('', 'info')
        addOutput('步骤4: 修复器官', 'info')
        // 确保物质充足
        reserveModifier.gainReserve('material', 50, player)
        const repairSuccess = await organModifier.repairOrgan(organ)
        if (repairSuccess) {
            addOutput(`  ✓ 器官已修复`, 'result')
        } else {
            addOutput(`  ⚠ 修复失败`, 'error')
        }

        // 步骤5: 再次升级
        addOutput('', 'info')
        addOutput('步骤5: 再次升级', 'info')
        const oldLevel2 = organ.level
        const upgradeSuccess2 = await organModifier.upgradeOrgan(organ)
        if (upgradeSuccess2) {
            addOutput(`  ✓ 升级成功: ${oldLevel2} → ${organ.level}`, 'result')
        } else {
            addOutput(`  ⚠ 升级失败`, 'error')
        }

        // 步骤6: 吞噬器官
        addOutput('', 'info')
        addOutput('步骤6: 吞噬器官', 'info')
        const organName = organ.label
        organModifier.devourOrgan(organ)
        addOutput(`  ✓ 器官已吞噬: ${organName}`, 'result')

        // 验证器官已被移除
        const remainingOrgans = organModifier.getOrgans()
        const stillHas = remainingOrgans.some((o: any) => o.key === testOrganKey)
        if (!stillHas) {
            addOutput(`  ✓ 器官已从列表中移除`, 'result')
        } else {
            addOutput(`  ⚠ 器官仍在列表中`, 'error')
        }

        addOutput('', 'info')
        addOutput('=== 器官系统自动化测试完成 ===', 'info')

    } catch (error: any) {
        addOutput(`测试失败: ${error.message}`, 'error')
        console.error(error)
    }
}

// ========== 触发器调试命令 ==========

// 列出实体的触发器
function listTriggers(targetType?: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const { getEntityTriggers, formatTriggerReport } = require('@/core/hooks/triggerDebug')

        let entity: any
        switch (targetType) {
            case 'enemy':
            case 'e':
                // 列出所有敌人的触发器
                const { nowBattle } = require('@/core/objects/game/battle')
                if (!nowBattle || nowBattle.enemies.length === 0) {
                    addOutput('当前没有敌人', 'error')
                    return
                }
                addOutput(`=== 战场上 ${nowBattle.enemies.length} 个敌人的触发器 ===`, 'info')
                addOutput('', 'info')
                for (const enemy of nowBattle.enemies) {
                    const report = getEntityTriggers(enemy)
                    const lines = formatTriggerReport(report)
                    for (const line of lines) {
                        addOutput(line, 'result')
                    }
                    addOutput('', 'info')
                }
                return
            case 'player':
            case 'p':
            default:
                entity = nowPlayer
                break
        }

        const report = getEntityTriggers(entity)
        const lines = formatTriggerReport(report)
        for (const line of lines) {
            addOutput(line, 'result')
        }

        addOutput('', 'info')
        addOutput('使用 removeTrigger("target", "id") 移除特定触发器', 'info')
        addOutput('  target: player 或 enemy', 'info')

    } catch (error: any) {
        addOutput(`列出触发器失败: ${error.message}`, 'error')
    }
}

// 移除触发器
async function removeTrigger(targetType: string, triggerId: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!targetType || !triggerId) {
        addOutput('用法: removeTrigger("target", "triggerId")', 'error')
        addOutput('例如: removeTrigger("player", "abc123")', 'info')
        addOutput('使用 listTriggers() 查看触发器 ID', 'info')
        return
    }

    try {
        const { removeTriggerById, getEntityTriggers } = require('@/core/hooks/triggerDebug')

        let entity: any
        switch (targetType) {
            case 'enemy':
            case 'e':
                const { nowBattle } = require('@/core/objects/game/battle')
                if (!nowBattle || nowBattle.enemies.length === 0) {
                    addOutput('当前没有敌人', 'error')
                    return
                }
                // 尝试在所有敌人中查找并移除
                for (const enemy of nowBattle.enemies) {
                    const success = removeTriggerById(enemy, triggerId)
                    if (success) {
                        addOutput(`✓ 已从敌人 ${enemy.label} 移除触发器`, 'result')
                        return
                    }
                }
                addOutput(`未找到触发器: ${triggerId}`, 'error')
                return
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

// 解锁所有器官
async function unlockAllOrgans() {
    const { getLazyModule } = await import('@/core/utils/lazyLoader')
    const { loadMetaProgress, saveMetaProgress, unlockOrgan } = await import('@/core/persistence/metaProgress')

    const organList = getLazyModule('organList')
    const metaProgress = loadMetaProgress()

    let unlockedCount = 0
    for (const organData of organList) {
        const isNew = unlockOrgan(metaProgress, organData.key)
        if (isNew) {
            unlockedCount++
        }
    }

    saveMetaProgress(metaProgress)

    addOutput(`✓ 已解锁所有器官`, 'result')
    addOutput(`  新解锁: ${unlockedCount} 个`, 'info')
    addOutput(`  总计: ${organList.length} 个`, 'info')
}

// 显示帮助
function showHelp() {
    addOutput('=== 可用命令 ===', 'info')
    addOutput('', 'info')
    addOutput('listRooms() - 列出所有房间', 'info')
    addOutput('listRooms("类型") - 列出指定类型的房间', 'info')
    addOutput('  例如: listRooms("battle")', 'info')
    addOutput('  例如: listRooms("treasure")', 'info')
    addOutput('', 'info')
    addOutput('enterRoom("房间key") - 进入指定房间', 'info')
    addOutput('enterRoom("房间key", 层级) - 进入指定房间并设置层级', 'info')
    addOutput('  例如: enterRoom("battle_elite_hydra", 1)', 'info')
    addOutput('  例如: enterRoom("treasure_default", 1)', 'info')
    addOutput('', 'info')
    addOutput('unlockAllRooms() - 解锁地图上所有房间', 'info')
    addOutput('  例如: unlockAllRooms()', 'info')
    addOutput('', 'info')
    addOutput('addTempCard("cardKey", "removeOn") - 添加临时卡牌', 'info')
    addOutput('  例如: addTempCard("original_card_00001", "battleEnd")', 'info')
    addOutput('addTempOrgan("organKey", "removeOn") - 添加临时器官', 'info')
    addOutput('  例如: addTempOrgan("original_organ_00001", "turnEnd")', 'info')
    addOutput('listTempItems() - 列出所有临时物品', 'info')
    addOutput('  移除时机: battleEnd, turnEnd, floorEnd', 'info')
    addOutput('', 'info')
    addOutput('addTestRelic("relicKey") - 添加测试遗物', 'info')
    addOutput('  例如: addTestRelic("testHealingPotion")', 'info')
    addOutput('addTestOrgan("organKey") - 添加测试器官', 'info')
    addOutput('  例如: addTestOrgan("testEnhancedHeart")', 'info')
    addOutput('listActiveAbilities() - 列出当前拥有的主动能力', 'info')
    addOutput('', 'info')
    addOutput('=== 器官系统命令 ===', 'info')
    addOutput('listOrgans() - 列出当前拥有的器官', 'info')
    addOutput('listAllOrgans() - 列出所有可用器官', 'info')
    addOutput('unlockAllOrgans() - 解锁所有器官（元进度）', 'info')
    addOutput('  例如: unlockAllOrgans()', 'info')
    addOutput('addOrgan("organKey") - 添加器官', 'info')
    addOutput('  例如: addOrgan("original_organ_00001")', 'info')
    addOutput('breakOrgan("organKey") - 损坏器官', 'info')
    addOutput('  例如: breakOrgan("original_organ_00001")', 'info')
    addOutput('repairOrgan("organKey") - 修复器官', 'info')
    addOutput('  例如: repairOrgan("original_organ_00001")', 'info')
    addOutput('upgradeOrgan("organKey") - 升级器官', 'info')
    addOutput('  例如: upgradeOrgan("original_organ_00001")', 'info')
    addOutput('removeOrgan("organKey") - 吞噬器官', 'info')
    addOutput('  例如: removeOrgan("original_organ_00001")', 'info')
    addOutput('testOrganFlow() - 自动化测试器官完整流程', 'info')
    addOutput('', 'info')
    addOutput('=== 调试工具命令 ===', 'info')
    addOutput('listTriggers("target") - 列出实体的触发器', 'info')
    addOutput('  target: player(默认) 或 enemy', 'info')
    addOutput('  例如: listTriggers()', 'info')
    addOutput('  例如: listTriggers("enemy")', 'info')
    addOutput('removeTrigger("target", "id") - 移除特定触发器', 'info')
    addOutput('  例如: removeTrigger("player", "abc123")', 'info')
    addOutput('', 'info')
    addOutput('gameOver() - 触发游戏失败', 'info')
    addOutput('  例如: gameOver()', 'info')
    addOutput('', 'info')
    addOutput('clear - 清空控制台', 'info')
    addOutput('help - 显示此帮助信息', 'info')
    addOutput('', 'info')
    addOutput('提示: 使用 ↑↓ 键浏览命令历史', 'info')
}

// 历史命令导航
function historyUp() {
    if (historyIndex.value > 0) {
        historyIndex.value--
        currentInput.value = commandHistory.value[historyIndex.value]
    }
}

function historyDown() {
    if (historyIndex.value < commandHistory.value.length - 1) {
        historyIndex.value++
        currentInput.value = commandHistory.value[historyIndex.value]
    } else {
        historyIndex.value = commandHistory.value.length
        currentInput.value = ''
    }
}

// 打开控制台
function open() {
    isVisible.value = true
    nextTick(() => {
        inputRef.value?.focus()
    })
    if (outputLines.value.length === 0) {
        addOutput('开发者控制台已启动', 'info')
        addOutput('输入 help 查看可用命令', 'info')
    }
}

// 关闭控制台
function close() {
    isVisible.value = false
}

// 切换控制台显示/隐藏
function toggle() {
    if (isVisible.value) {
        close()
    } else {
        open()
    }
}

// 生命周期
onMounted(() => {
    // 暴露到全局
    ;(window as any).openConsole = open
    ;(window as any).closeConsole = close
    ;(window as any).toggleConsole = toggle
})

onUnmounted(() => {
    delete (window as any).openConsole
    delete (window as any).closeConsole
    delete (window as any).toggleConsole
})

defineExpose({ open, close, toggle })
</script>

<style scoped lang="scss">
.console-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 400px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-top: 2px solid #333;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #2d2d2d;
        border-bottom: 1px solid #333;
        color: #ccc;
        font-size: 12px;

        button {
            background: none;
            border: none;
            color: #ccc;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            line-height: 1;

            &:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
            }
        }
    }

    .output {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        line-height: 1.5;

        .output-line {
            margin-bottom: 2px;

            .prompt {
                color: #4ec9b0;
                margin-right: 4px;
            }

            .text {
                &.command {
                    color: #d4d4d4;
                }

                &.result {
                    color: #4ec9b0;
                }

                &.error {
                    color: #f48771;
                }

                &.info {
                    color: #9cdcfe;
                }
            }
        }
    }

    .input-area {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        background: #252526;
        border-top: 1px solid #333;

        .prompt {
            color: #4ec9b0;
            margin-right: 8px;
        }

        input {
            flex: 1;
            background: transparent;
            border: none;
            color: #d4d4d4;
            font-family: inherit;
            font-size: inherit;
            outline: none;

            &::placeholder {
                color: #666;
            }
        }
    }

    // 滚动条样式
    .output::-webkit-scrollbar {
        width: 10px;
    }

    .output::-webkit-scrollbar-track {
        background: #1e1e1e;
    }

    .output::-webkit-scrollbar-thumb {
        background: #424242;
        border-radius: 5px;

        &:hover {
            background: #4e4e4e;
        }
    }
}
</style>
