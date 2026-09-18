<template>
<div class="home-page">
    <div class="title">蘇生尖塔</div>
    <div class="control">
        <div
            v-for="item in buttonList"
            :key="item.label"
            class="menu-btn"
            @click="item.click"
        >
            {{ item.label }}
        </div>
    </div>

    <div class="corner-left">
        <Popover trigger="click" placement="top" align="start">
            <div class="about-btn">关于我们</div>
            <template #content>
                <div class="about-tip">
                    <div>QQ群</div>
                    <div class="qq-number">{{ QQ_GROUP }}</div>
                </div>
            </template>
        </Popover>
    </div>
    <div class="corner-right">v{{ GAME_VERSION }}</div>

    <Teleport to="body">
        <div
            v-if="showOptions"
            class="option-overlay"
            :style="{ zIndex: SHOW_POPUP_Z_INDEX }"
            @click.self="closeOptions"
        >
            <div class="option-bar">
                <Button large :click="openSettingsFromOptions" label="设置" />
                <Button large :click="exportSave" label="导出存档" />
                <Button large :click="importSave" label="导入存档" />
                <Button large :click="closeOptions" label="返回" />
            </div>
        </div>
    </Teleport>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
</div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SettingsModal from '@/ui/components/interaction/SettingsModal.vue'
import Popover from '@/ui/components/global/Popover.vue'
import Button from '@/ui/components/global/Button.vue'
import { GAME_VERSION, QQ_GROUP } from '@/ui/hooks/global/creatorEasterEgg'
import { requestGameFullscreen } from '@/ui/hooks/global/layoutMode'
import { copySaveToClipboard, importSaveFromClipboard, loadMetaProgress, type MetaProgressSave } from '@/core/persistence/metaProgress'
import { SHOW_POPUP_Z_INDEX } from '@/ui/hooks/interaction/popoverHost'

const router = useRouter()

const showSettings = ref(false)
const showOptions = ref(false)
const metaProgress = ref<MetaProgressSave>(loadMetaProgress())

const buttonList: { label: string, click: () => void }[] = [
    { label: "开始游戏", click: () => {
        requestGameFullscreen()
        router.push('/setup')
    } },
    { label: "选项", click: () => showOptions.value = true }
]

function closeOptions() {
    showOptions.value = false
}

function openSettingsFromOptions() {
    closeOptions()
    showSettings.value = true
}

async function exportSave() {
    const success = await copySaveToClipboard(metaProgress.value)
    if (success) {
        closeOptions()
        alert('存档已复制到剪贴板')
    }
}

async function importSave() {
    const success = await importSaveFromClipboard()
    if (success) {
        metaProgress.value = loadMetaProgress()
        closeOptions()
        alert('存档导入成功')
    }
}
</script>

<style scoped lang='scss'>
.home-page {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.title {
    font-size: 80px;
    font-weight: bold;
    margin-bottom: 60px;
}

.control {
    display: flex;
    flex-direction: column;
    gap: var(--layout-gap-md);
}

.menu-btn {
    padding: 15px 60px;
    font-size: 24px;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}

.corner-left,
.corner-right {
    position: absolute;
    bottom: 24px;
}

.corner-left {
    left: 24px;
}

.corner-right {
    right: 24px;
    font-size: 16px;
}

.about-btn {
    padding: 8px 16px;
    font-size: 16px;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.about-tip {
    background: #fff;
    border: 2px solid #000;
    padding: 12px 16px;
    font-size: 16px;
}

.qq-number {
    margin-top: 4px;
    font-size: 20px;
    font-weight: bold;
    user-select: all;
}

.option-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.option-bar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--layout-gap-md);
    width: min(420px, 80vw);

    :deep(.game-btn) {
        width: 100%;
        font-size: 22px;

        .game-btn-face {
            background: #fff;
            padding: 16px 28px;
        }
    }
}
</style>
