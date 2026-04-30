<template>
<div class="console-panel" v-if="isVisible">
    <div class="header">
        <span>开发者控制台</span>
        <button @click="close">×</button>
    </div>
    <div class="output" ref="outputRef">
        <div v-for="(line, index) in outputLines" :key="index" class="output-line">
            <span v-if="line.type === 'command'" class="prompt">&gt; </span>
            <span
                :class="['text', line.type, { clickable: !!(line.clickable || line.action) }]"
                @click="line.action ? line.action() : (line.clickable ? fillInput(line.clickable) : undefined)"
            >{{ line.text }}</span>
        </div>
    </div>
    <div class="input-area">
        <span class="prompt">&gt; </span>
        <input
            ref="inputRef"
            v-model="currentInput"
            @keydown.enter="executeCommand"
            @keydown.up.prevent="historyUp"
            @keydown.down.prevent="historyDown"
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
import { getDescribe } from '@/ui/hooks/express/describe'

interface OutputLine {
    type: 'command' | 'result' | 'error' | 'info' | 'example'
    text: string
    clickable?: string    // 点击后填入输入栏的命令文本
    action?: () => void   // 点击后执行的自定义动作（优先于 clickable）
    sectionKey?: string   // 所属区域（用于折叠/展开控制）
}

const isVisible = ref(false)
const currentInput = ref('')
const outputLines = ref<OutputLine[]>([])
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)
const outputRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

const HISTORY_STORAGE_KEY = 'dev-console-history'
const HISTORY_MAX = 20

// 帮助区域定义
const helpSections: Array<{ key: string, title: string, items: Array<{ cmd: string, desc: string, examples?: string[] }> }> = [
    {
        key: '房间',
        title: '房间命令',
        items: [
            { cmd: 'listRooms()', desc: '列出所有房间', examples: ['listRooms("battle")'] },
            { cmd: 'enterRoom("key", layer?)', desc: '进入指定房间', examples: ['enterRoom("battle_elite_hydra", 1)'] },
            { cmd: 'unlockAllRooms()', desc: '解锁地图所有房间' },
        ]
    },
    {
        key: '事件',
        title: '事件调试命令',
        items: [
            { cmd: 'listEvents()', desc: '列出所有事件' },
            { cmd: 'enterEvent("key")', desc: '进入指定事件', examples: ['enterEvent("sts_event_big_fish")'] },
        ]
    },
    {
        key: '战斗',
        title: '战斗调试命令',
        items: [
            { cmd: 'startBattle("enemy1", "enemy2"?, layer?)', desc: '立即开始战斗（支持多敌人）', examples: ['startBattle("test_enemy_slime")', 'startBattle("test_enemy_slime", "test_enemy_slime", 1)'] },
            { cmd: 'listEnemies()', desc: '列出所有敌人' },
            { cmd: 'dealDamage(伤害)', desc: '测试造成伤害', examples: ['dealDamage(25)'] },
            { cmd: 'gameOver()', desc: '触发游戏失败' },
        ]
    },
    {
        key: '遗物',
        title: '遗物系统命令',
        items: [
            { cmd: 'listRelics()', desc: '列出当前遗物' },
            { cmd: 'listAllRelics()', desc: '列出所有遗物' },
            { cmd: 'gainRelic("key")', desc: '获得指定遗物', examples: ['gainRelic("original_relic_00001")'] },
            { cmd: 'removeRelic("key")', desc: '移除指定遗物' },
            { cmd: 'addRandomRelic()', desc: '随机获取遗物' },
        ]
    },
    {
        key: '器官',
        title: '器官系统命令',
        items: [
            { cmd: 'listOrgans()', desc: '列出当前器官' },
            { cmd: 'listAllOrgans()', desc: '列出所有器官' },
            { cmd: 'addOrgan("key")', desc: '添加器官', examples: ['addOrgan("original_organ_00001")'] },
            { cmd: 'breakOrgan("key")', desc: '损坏器官' },
            { cmd: 'repairOrgan("key")', desc: '修复器官' },
            { cmd: 'upgradeOrgan("key")', desc: '升级器官' },
            { cmd: 'removeOrgan("key")', desc: '吞噬器官' },
            { cmd: 'unlockAllOrgans()', desc: '解锁所有器官（图鉴）' },
        ]
    },
    {
        key: '卡牌',
        title: '卡牌命令',
        items: [
            { cmd: 'listCards()', desc: '列出所有可用卡牌' },
            { cmd: 'listCards("关键词")', desc: '搜索卡牌', examples: ['listCards("悔恨")'] },
            { cmd: 'addCard("key")', desc: '添加卡牌到卡组', examples: ['addCard("sts_card_regret")'] },
        ]
    },
    {
        key: '临时物品',
        title: '临时物品命令',
        items: [
            { cmd: 'addTempCard("key", "removeOn")', desc: '添加临时卡牌' },
            { cmd: 'addTempOrgan("key", "removeOn")', desc: '添加临时器官' },
            { cmd: 'listTempItems()', desc: '列出临时物品' },
        ]
    },
    {
        key: '主动',
        title: '主动能力命令',
        items: [
            { cmd: 'listActiveAbilities()', desc: '列出主动能力' },
        ]
    },
    {
        key: '调试',
        title: '调试工具命令',
        items: [
            { cmd: 'listTriggers("target")', desc: '列出触发器' },
            { cmd: 'removeTrigger("target", "id")', desc: '移除触发器' },
        ]
    },
    {
        key: '黑市',
        title: '黑市相关命令',
        items: [
            { cmd: 'enterBlackStore(layer?)', desc: '进入黑市', examples: ['enterBlackStore()', 'enterBlackStore(3)'] },
        ]
    },
    {
        key: '水池',
        title: '水池相关命令',
        items: [
            { cmd: 'enterPool(layer?)', desc: '进入水池', examples: ['enterPool()', 'enterPool(3)'] },
        ]
    },
    {
        key: '控制台',
        title: '控制台命令',
        items: [
            { cmd: 'clear', desc: '清空控制台' },
            { cmd: 'help', desc: '显示全部帮助' },
            { cmd: 'help --区域', desc: '只显示指定区域' },
            { cmd: 'help --all', desc: '展开显示全部' },
        ]
    },
]

// 折叠状态：key 为区域名，value 为是否折叠（默认全部收起）
const collapsedSections = ref<Record<string, boolean>>(
    Object.fromEntries(helpSections.map(s => [s.key, true]))
)

// 添加输出行
function addOutput(text: string, type: OutputLine['type'] = 'result', clickable?: string, action?: () => void) {
    outputLines.value.push({ type, text, clickable, action })
    nextTick(() => {
        if (outputRef.value) {
            outputRef.value.scrollTop = outputRef.value.scrollHeight
        }
    })
}

// 点击命令行，填入输入栏
function fillInput(command: string) {
    currentInput.value = command
    nextTick(() => inputRef.value?.focus())
}

// 执行命令
async function executeCommand() {
    const command = currentInput.value.trim()
    if (!command) return

    // 显示命令
    addOutput(command, 'command')

    // 添加到历史（去重：如果末尾已有相同命令则不重复添加）
    if (commandHistory.value[commandHistory.value.length - 1] !== command) {
        commandHistory.value.push(command)
        if (commandHistory.value.length > HISTORY_MAX) {
            commandHistory.value.splice(0, commandHistory.value.length - HISTORY_MAX)
        }
        // 持久化到 localStorage
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(commandHistory.value))
        } catch {}
    }
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
    } else if (command === 'help' || command.startsWith('help --')) {
        const filter = command.startsWith('help --') ? command.slice(7).trim() : undefined
        helpBlockStart = -1  // 重置，作为新的帮助块
        showHelp(filter)
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
        case 'listCards':
            await listCards(args[0])
            break
        case 'addCard':
            await addCardToDeck(args[0])
            break
        case 'addTempCard':
            await addTemporaryCard(args[0], args[1] || 'battleEnd')
            break
        case 'addTempOrgan':
            await addTemporaryOrgan(args[0], args[1] || 'battleEnd')
            break
        case 'listTempItems':
            await listTemporaryItems()
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
            await listOrgans()
            break
        case 'listAllOrgans':
            await listAllOrgans()
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
            await listTriggers(args[0])
            break
        case 'removeTrigger':
            await removeTrigger(args[0], args[1])
            break
        case 'unlockAllOrgans':
            await unlockAllOrgans()
            break
        case 'addRandomRelic':
            await addRandomRelic()
            break
        case 'gainRelic':
            await gainRelic(args[0])
            break
        case 'removeRelic':
            await removeRelic(args[0])
            break
        case 'dealDamage':
            await dealDamage(args[0])
            break
        case 'listRelics':
            await listRelics()
            break
        case 'listAllRelics':
            await listAllRelics()
            break
        case 'startBattle':
            await startBattle(...args)
            break
        case 'listEnemies':
            await listEnemies()
            break
        case 'listEvents':
            listEvents()
            break
        case 'enterEvent':
            await enterEvent(args[0])
            break
        case 'enterBlackStore':
            await enterBlackStore(args[0])
            break
        case 'enterPool':
            await enterPool(args[0])
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

// 列出所有事件
function listEvents() {
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

// 进入指定事件
async function enterEvent(eventKey: string) {
    if (!eventKey) {
        addOutput('用法: enterEvent("事件key")', 'error')
        addOutput('使用 listEvents() 查看所有事件', 'info')
        return
    }

    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    const room = roomRegistry.createRoom(eventKey, nowGameRun.layer || 1)
    if (!room) {
        addOutput(`创建事件房间失败: ${eventKey}`, 'error')
        addOutput('使用 listEvents() 查看所有可用事件', 'info')
        return
    }

    await nowGameRun.enterRoom(room)
    addOutput(`✓ 成功进入事件: ${eventKey}`, 'result')

    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
}

// 进入黑市
async function enterBlackStore(layer?: number) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    const actualLayer = layer ?? nowGameRun.towerLevel ?? 1
    addOutput(`进入黑市，层级: ${actualLayer}`, 'info')

    const room = roomRegistry.createRoom("blackStore_default", actualLayer)
    if (!room) {
        addOutput('创建黑市房间失败，请确认黑市房间已注册', 'error')
        return
    }

    await nowGameRun.enterRoom(room)
    addOutput('✓ 成功进入黑市', 'result')

    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
}

// 进入水池
async function enterPool(layer?: number) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    const actualLayer = layer ?? nowGameRun.towerLevel ?? 1
    addOutput(`进入水池，层级: ${actualLayer}`, 'info')

    const room = roomRegistry.createRoom("pool_default", actualLayer)
    if (!room) {
        addOutput('创建水池房间失败，请确认水池房间已注册', 'error')
        return
    }

    await nowGameRun.enterRoom(room)
    addOutput('✓ 成功进入水池', 'result')

    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }
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

// 列出所有可用卡牌
async function listCards(keyword?: string) {
    try {
        const { cardList } = await import('@/static/list/item/cardList')
        let cards = cardList
        if (keyword) {
            cards = cards.filter((c: any) => c.label?.includes(keyword) || c.key?.includes(keyword))
        }
        if (cards.length === 0) {
            addOutput(keyword ? `没有找到匹配 "${keyword}" 的卡牌` : '没有可用的卡牌', 'info')
            return
        }
        addOutput(`共 ${cards.length} 张卡牌:`, 'info')
        for (const card of cards) {
            addOutput(`  ${card.label} - ${card.key}`, 'result', `addCard("${card.key}")`)
        }
    } catch (error: any) {
        addOutput(`列出卡牌失败: ${error.message}`, 'error')
    }
}

// 添加卡牌到卡组
async function addCardToDeck(cardKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始', 'error')
        return
    }
    if (!cardKey) {
        addOutput('用法: addCard("cardKey")', 'error')
        addOutput('例如: addCard("sts_card_regret")', 'info')
        addOutput('使用 listCards() 查看所有可用卡牌', 'info')
        return
    }
    try {
        const { getCardModifier } = await import('@/core/objects/system/modifier/CardModifier')
        const player = nowPlayer
        const cardModifier = getCardModifier(player)
        const cards = await cardModifier.addCardsFromSource(player, [cardKey])
        if (cards.length > 0) {
            addOutput(`✓ 已添加 ${cards[0].label} 到卡组`, 'result')
        } else {
            addOutput(`添加失败：未找到卡牌 ${cardKey}`, 'error')
        }
    } catch (error: any) {
        addOutput(`添加卡牌失败: ${error.message}`, 'error')
    }
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
async function listTemporaryItems() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const { getAllTemporaryItems } = await import('@/core/hooks/temporary')
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
async function listActiveAbilities() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const player = nowPlayer
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
        const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')

        const organModifier = getOrganModifier(player)
        const relicModifier = getRelicModifier(player)

        const organs = organModifier.getOrgans()
        const relics = relicModifier.getRelics()

        let totalAbilities = 0

        addOutput('=== 当前拥有的主动能力 ===', 'info')
        addOutput('', 'info')

        // 遗物的主动能力
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

        // 器官的主动能力
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

// 列出玩家当前拥有的器官
async function listOrgans() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const player = nowPlayer
        const { getOrganModifier } = await import('@/core/objects/system/modifier/OrganModifier')
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
async function listAllOrgans() {
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
async function listTriggers(targetType?: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const { getEntityTriggers, formatTriggerReport } = await import('@/core/hooks/triggerDebug')

        let entity: any
        switch (targetType) {
            case 'enemy':
            case 'e':
                // 列出所有敌人的触发器
                const { nowBattle } = await import('@/core/objects/game/battle')
                const enemies = nowBattle?.value?.getTeam("enemy") ?? []
                if (enemies.length === 0) {
                    addOutput('当前没有敌人', 'error')
                    return
                }
                addOutput(`=== 战场上 ${enemies.length} 个敌人的触发器 ===`, 'info')
                addOutput('', 'info')
                for (const enemy of enemies) {
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
        const { removeTriggerById } = await import('@/core/hooks/triggerDebug')

        let entity: any
        switch (targetType) {
            case 'enemy':
            case 'e':
                const { nowBattle } = await import('@/core/objects/game/battle')
                const enemies = nowBattle?.value?.getTeam("enemy") ?? []
                if (enemies.length === 0) {
                    addOutput('当前没有敌人', 'error')
                    return
                }
                // 尝试在所有敌人中查找并移除
                for (const enemy of enemies) {
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

    const organList = getLazyModule<any[]>('organList')
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

// 随机获取一个遗物
async function addRandomRelic() {
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

        // 随机选择一个遗物
        const randomIndex = Math.floor(Math.random() * allRelics.length)
        const relicMap = allRelics[randomIndex]

        const relic = await createRelic(relicMap)
        const player = nowPlayer
        getRelic(player, player, relic)

        addOutput(`✓ 成功获得随机遗物: ${relic.label} [${relic.rarity}]`, 'result')
        addOutput(`  key: ${relic.key}`, 'info')

    } catch (error: any) {
        addOutput(`获取随机遗物失败: ${error.message}`, 'error')
    }
}

// 对当前玩家造成伤害
async function dealDamage(value: number) {
    if (!nowPlayer) {
        addOutput('玩家不存在', 'error')
        return
    }

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

// 获得指定遗物
async function gainRelic(relicKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!relicKey) {
        addOutput('用法: gainRelic("relicKey")', 'error')
        addOutput('例如: gainRelic("original_relic_00001")', 'info')
        addOutput('使用 listAllRelics() 查看所有可用遗物', 'info')
        return
    }

    try {
        const { getRelicByKey } = await import('@/static/list/item/relicList')
        const { getRelic } = await import('@/core/objects/item/Subclass/Relic')

        const relic = await getRelicByKey(relicKey)
        const player = nowPlayer
        getRelic(player, player, relic)

        addOutput(`✓ 成功获得遗物: ${relic.label} [${relic.rarity}]`, 'result')
    } catch (error: any) {
        addOutput(`获得遗物失败: ${error.message}`, 'error')
    }
}

// 移除指定遗物
async function removeRelic(relicKey: string) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    if (!relicKey) {
        addOutput('用法: removeRelic("relicKeyOrId")', 'error')
        addOutput('例如: removeRelic("original_relic_00001")', 'info')
        addOutput('或: removeRelic("<__id>")', 'info')
        addOutput('使用 listRelics() 查看当前拥有的遗物', 'info')
        return
    }

    try {
        const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')
        const player = nowPlayer
        const relicModifier = getRelicModifier(player)

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

// 列出当前拥有的遗物
async function listRelics() {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    try {
        const { getRelicModifier } = await import('@/core/objects/system/modifier/RelicModifier')
        const player = nowPlayer
        const relicModifier = getRelicModifier(player)
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

// 列出所有可用遗物
async function listAllRelics() {
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

// 立即开始与指定敌人的战斗（支持多个敌人）
async function startBattle(...args: any[]) {
    if (!nowGameRun) {
        addOutput('游戏未开始，请先点击"开始游戏"', 'error')
        return
    }

    // 解析参数：字符串为敌人key，数字为层级
    const enemyKeys: string[] = []
    let layer: number | undefined
    for (const arg of args) {
        if (typeof arg === 'string') {
            enemyKeys.push(arg)
        } else if (typeof arg === 'number') {
            layer = arg
        }
    }

    if (enemyKeys.length === 0) {
        addOutput('用法: startBattle("enemyKey1", "enemyKey2"?, layer?)', 'error')
        addOutput('例如: startBattle("test_enemy_slime", "test_enemy_slime", 1)', 'error')
        addOutput('使用 listEnemies() 查看所有敌人', 'info')
        return
    }

    try {
        const { BattleRoom } = await import('@/core/objects/room/BattleRoom')
        const { hasEnemy } = await import('@/static/list/target/enemyList')

        // 验证所有敌人是否存在
        for (const key of enemyKeys) {
            if (!hasEnemy(key)) {
                addOutput(`未找到敌人: ${key}`, 'error')
                return
            }
        }

        // 确定层级
        const battleLayer = layer !== undefined ? layer : (nowGameRun.currentRoom?.layer || 1)

        const enemyNames = enemyKeys.join(', ')
        addOutput(`准备与 ${enemyNames} 战斗 (层级: ${battleLayer})`, 'info')

        // 如果当前有房间，先完成并退出
        if (nowGameRun.currentRoom) {
            addOutput('退出当前房间...', 'info')
            await nowGameRun.completeCurrentRoom()
        }

        // 创建战斗房间
        const battleRoom = new BattleRoom({
            type: 'battle',
            layer: battleLayer,
            battleType: 'normal',
            enemyConfigs: enemyKeys
        })

        addOutput(`✓ 创建战斗房间成功 (${enemyKeys.length}个敌人)`, 'result')

        // 进入战斗房间
        await nowGameRun.enterRoom(battleRoom)
        addOutput(`✓ 进入战斗房间`, 'result')

        // 处理房间内容（启动战斗）
        await battleRoom.process()
        addOutput(`✓ 战斗开始！`, 'result')

        // 如果不在 running 页面，跳转过去
        if (router.currentRoute.value.path !== '/running') {
            router.replace('/running')
        }

    } catch (error: any) {
        addOutput(`开始战斗失败: ${error.message}`, 'error')
        console.error(error)
    }
}

// 列出所有可用敌人
async function listEnemies() {
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

// 记录当前帮助块的起始行索引（用于折叠/展开时原地替换）
let helpBlockStart = -1

// 显示帮助
function showHelp(filter?: string) {
    // 'all' 展开所有区域
    const showAll = filter === 'all'
    const effectiveFilter = showAll ? undefined : filter

    // 过滤要显示的区域
    let sections: typeof helpSections = helpSections
    if (effectiveFilter) {
        sections = helpSections.filter(s => s.key === effectiveFilter || s.title.includes(effectiveFilter))
        if (sections.length === 0) {
            addOutput(`未找到区域 "${effectiveFilter}"，可用区域: ${helpSections.map(s => s.key).join(' / ')}`, 'error')
            return
        }
    }

    // 如果是折叠/展开操作（helpBlockStart 有效），原地替换帮助块
    const isRefresh = helpBlockStart >= 0 && helpBlockStart < outputLines.value.length
    if (isRefresh) {
        outputLines.value.splice(helpBlockStart)
    } else {
        helpBlockStart = outputLines.value.length
    }

    // 标题
    if (!effectiveFilter) {
        addOutput('=== 可用命令 ===  提示: 点击标题收起/展开，点击命令或例子填入输入栏', 'info')
        addOutput('可用区域: ' + helpSections.map(s => s.key).join(' / '), 'info')
    }
    addOutput('', 'info')

    // 渲染每个区域
    for (const section of sections) {
        const isCollapsed = collapsedSections.value[section.key]
        const collapseHint = effectiveFilter ? '' : (isCollapsed ? '[+] ' : '[-] ')
        addOutput(`=== ${collapseHint}${section.title} ===`, 'info', undefined, () => {
            collapsedSections.value[section.key] = !collapsedSections.value[section.key]
            showHelp(filter)
        })

        if (!isCollapsed || !!effectiveFilter || showAll) {
            for (const item of section.items) {
                addOutput(`  ${item.cmd}  —  ${item.desc}`, 'info', item.cmd)
                if (item.examples && item.examples.length > 0) {
                    for (const ex of item.examples) {
                        addOutput(`   示例: ${ex}`, 'example', ex)
                    }
                }
            }
        }
        addOutput('', 'info')
    }

    if (!effectiveFilter) {
        addOutput('提示: 使用 ↑↓ 键浏览历史命令（跨会话保留）', 'info')
    }
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

// 全局按键监听
function handleGlobalKeydown(e: KeyboardEvent) {
    const tag = (document.activeElement as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'p' || e.key === 'P') {
        toggle()
    }
}

// 生命周期
onMounted(() => {
    // 从 localStorage 恢复历史记录
    try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
        if (stored) {
            const loaded = JSON.parse(stored)
            if (Array.isArray(loaded)) {
                commandHistory.value = loaded.slice(-HISTORY_MAX)
                historyIndex.value = commandHistory.value.length
            }
        }
    } catch {}

    // 暴露到全局
    ;(window as any).openConsole = open
    ;(window as any).closeConsole = close
    ;(window as any).toggleConsole = toggle
    // 注册全局按键监听
    document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
    delete (window as any).openConsole
    delete (window as any).closeConsole
    delete (window as any).toggleConsole
    // 移除全局按键监听
    document.removeEventListener('keydown', handleGlobalKeydown)
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

                &.example {
                    color: #adadad;
                    padding-left: 18px;
                }

                &.clickable {
                    cursor: pointer;
                    &:hover {
                        text-decoration: underline;
                        background: rgba(78, 201, 176, 0.1);
                    }
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
