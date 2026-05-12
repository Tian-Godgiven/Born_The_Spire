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
import { consoleCommandRegistry } from '@/core/utils/consoleCommandRegistry'
import { registerAllCommands } from './commands'

interface OutputLine {
    type: 'command' | 'result' | 'error' | 'info' | 'example'
    text: string
    clickable?: string
    action?: () => void
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

// 注册所有内置命令
registerAllCommands()

// ========== 输出 ==========

function addOutput(text: string, type: OutputLine['type'] = 'result', clickable?: string, action?: () => void) {
    outputLines.value.push({ type, text, clickable, action })
    nextTick(() => {
        if (outputRef.value) {
            outputRef.value.scrollTop = outputRef.value.scrollHeight
        }
    })
}

function fillInput(command: string) {
    currentInput.value = command
    nextTick(() => inputRef.value?.focus())
}

// ========== 命令解析 ==========

async function executeCommand() {
    const command = currentInput.value.trim()
    if (!command) return

    addOutput(command, 'command')

    // 历史记录
    if (commandHistory.value[commandHistory.value.length - 1] !== command) {
        commandHistory.value.push(command)
        if (commandHistory.value.length > HISTORY_MAX) {
            commandHistory.value.splice(0, commandHistory.value.length - HISTORY_MAX)
        }
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(commandHistory.value))
        } catch {}
    }
    historyIndex.value = commandHistory.value.length
    currentInput.value = ''

    try {
        await parseAndExecute(command)
    } catch (error: any) {
        addOutput(`错误: ${error.message}`, 'error')
    }
}

function parseCommandArgs(argsStr: string): any[] {
    if (!argsStr.trim()) return []

    const args: any[] = []
    let i = 0
    const str = argsStr.trim()

    while (i < str.length) {
        while (i < str.length && (str[i] === ' ' || str[i] === ',')) i++
        if (i >= str.length) break

        if (str[i] === '{') {
            const start = i
            let depth = 1
            i++
            while (i < str.length && depth > 0) {
                if (str[i] === '{') depth++
                else if (str[i] === '}') depth--
                i++
            }
            const objStr = str.slice(start, i)
            try {
                const jsonStr = objStr.replace(/(\w+)\s*:/g, '"$1":')
                args.push(JSON.parse(jsonStr))
            } catch {
                args.push(objStr)
            }
        } else if (str[i] === '"' || str[i] === "'") {
            const quote = str[i]
            i++
            const start = i
            while (i < str.length && str[i] !== quote) i++
            args.push(str.slice(start, i))
            i++
        } else {
            const start = i
            while (i < str.length && str[i] !== ',' && str[i] !== ' ') i++
            const token = str.slice(start, i).trim()
            const num = Number(token)
            args.push(isNaN(num) ? token : num)
        }
    }

    return args
}

async function parseAndExecute(command: string) {
    const parenIndex = command.indexOf('(')
    const isFunc = parenIndex > 0 && command.endsWith(')')

    if (isFunc) {
        const funcName = command.slice(0, parenIndex).trim()
        const argsStr = command.slice(parenIndex + 1, -1)
        const args = parseCommandArgs(argsStr)

        // 从 registry 查找命令
        const cmd = consoleCommandRegistry.getCommand(funcName)
        if (cmd) {
            await cmd.execute(args, addOutput)
        } else {
            addOutput(`未知函数: ${funcName}`, 'error')
            addOutput('输入 help 查看可用命令', 'info')
        }
    } else if (command === 'help' || command.startsWith('help --')) {
        const filter = command.startsWith('help --') ? command.slice(7).trim() : undefined
        helpBlockStart = -1
        showHelp(filter)
    } else if (command === 'clear') {
        outputLines.value = []
    } else {
        addOutput(`未知命令: ${command}`, 'error')
        addOutput('输入 help 查看帮助', 'info')
    }
}

// ========== 帮助系统 ==========

// 折叠状态
const collapsedSections = ref<Record<string, boolean>>({})
let helpBlockStart = -1

function showHelp(filter?: string) {
    const showAll = filter === 'all'
    const effectiveFilter = showAll ? undefined : filter

    const grouped = consoleCommandRegistry.getCommandsByGroup()

    let sections = grouped
    if (effectiveFilter) {
        sections = grouped.filter(g => g.group.key === effectiveFilter || g.group.title.includes(effectiveFilter))
        if (sections.length === 0) {
            addOutput(`未找到区域 "${effectiveFilter}"，可用区域: ${grouped.map(g => g.group.key).join(' / ')}`, 'error')
            return
        }
    }

    // 初始化折叠状态（默认收起）
    for (const { group } of grouped) {
        if (!(group.key in collapsedSections.value)) {
            collapsedSections.value[group.key] = true
        }
    }

    // 如果是折叠/展开操作，原地替换帮助块
    const isRefresh = helpBlockStart >= 0 && helpBlockStart < outputLines.value.length
    if (isRefresh) {
        outputLines.value.splice(helpBlockStart)
    } else {
        helpBlockStart = outputLines.value.length
    }

    if (!effectiveFilter) {
        addOutput('=== 可用命令 ===  提示: 点击标题收起/展开，点击命令或例子填入输入栏', 'info')
        addOutput('可用区域: ' + grouped.map(g => g.group.key).join(' / '), 'info')
    }
    addOutput('', 'info')

    for (const { group, commands } of sections) {
        const isCollapsed = collapsedSections.value[group.key]
        const collapseHint = effectiveFilter ? '' : (isCollapsed ? '[+] ' : '[-] ')
        addOutput(`=== ${collapseHint}${group.title} ===`, 'info', undefined, () => {
            collapsedSections.value[group.key] = !collapsedSections.value[group.key]
            showHelp(filter)
        })

        if (!isCollapsed || !!effectiveFilter || showAll) {
            for (const cmd of commands) {
                addOutput(`  ${cmd.usage}  —  ${cmd.description}`, 'info', cmd.usage)
                if (cmd.examples) {
                    for (const ex of cmd.examples) {
                        addOutput(`   示例: ${ex}`, 'example', ex)
                    }
                }
            }
        }
        addOutput('', 'info')
    }

    // 控制台自身的命令
    if (!effectiveFilter) {
        addOutput('=== 控制台命令 ===', 'info')
        addOutput('  clear  —  清空控制台', 'info', 'clear')
        addOutput('  help  —  显示全部帮助', 'info', 'help')
        addOutput('  help --区域  —  只显示指定区域', 'info')
        addOutput('  help --all  —  展开显示全部', 'info', 'help --all')
        addOutput('', 'info')
        addOutput('提示: 使用 ↑↓ 键浏览历史命令（跨会话保留）', 'info')
    }
}

// ========== 历史导航 ==========

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

// ========== 开关控制 ==========

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

function close() {
    isVisible.value = false
}

function toggle() {
    if (isVisible.value) close()
    else open()
}

function handleGlobalKeydown(e: KeyboardEvent) {
    const tag = (document.activeElement as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'p' || e.key === 'P') {
        toggle()
    }
}

// ========== 生命周期 ==========

onMounted(() => {
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

    ;(window as any).openConsole = open
    ;(window as any).closeConsole = close
    ;(window as any).toggleConsole = toggle
    document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
    delete (window as any).openConsole
    delete (window as any).closeConsole
    delete (window as any).toggleConsole
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
