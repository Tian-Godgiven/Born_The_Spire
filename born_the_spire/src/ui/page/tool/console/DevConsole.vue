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
import { ref, nextTick } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
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

// 显示帮助
function showHelp() {
    addOutput('=== 可用命令 ===', 'info')
    addOutput('', 'info')
    addOutput('listRooms() - 列出所有房间', 'info')
    addOutput('listRooms("类型") - 列出指定类型的房间', 'info')
    addOutput('  例如: listRooms("battle")', 'info')
    addOutput('', 'info')
    addOutput('enterRoom("房间key") - 进入指定房间', 'info')
    addOutput('enterRoom("房间key", 层级) - 进入指定房间并设置层级', 'info')
    addOutput('  例如: enterRoom("battle_elite_hydra", 1)', 'info')
    addOutput('', 'info')
    addOutput('unlockAllRooms() - 解锁地图上所有房间', 'info')
    addOutput('  例如: unlockAllRooms()', 'info')
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

// 暴露到全局
;(window as any).openConsole = open

defineExpose({ open, close })
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
