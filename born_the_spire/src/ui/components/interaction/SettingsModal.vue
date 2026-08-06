<template>
<Teleport to="body">
    <div class="settings-overlay" @click.self="close">
        <div class="settings-modal">
            <div class="modal-header">
                <h2>设置</h2>
                <div class="header-actions">
                    <button class="action-btn" @click="resetSettings">恢复默认</button>
                    <button class="close-btn" @click="close">×</button>
                </div>
            </div>

            <div class="divider"></div>

            <div class="tab-bar">
                <button
                    v-for="tab in TABS"
                    :key="tab.key"
                    class="tab-btn"
                    :class="{ on: activeTab === tab.key }"
                    @click="activeTab = tab.key"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div class="divider"></div>

            <div class="modal-content">
                <!-- 通用 -->
                <template v-if="activeTab === 'general'">
                    <div
                        v-for="definition in settingDefinitions"
                        :key="definition.key"
                        class="setting-row"
                    >
                        <div class="setting-text">
                            <div class="setting-label">{{ definition.label }}</div>
                            <div class="setting-describe" v-if="definition.describe">
                                {{ definition.describe }}
                            </div>
                        </div>
                        <button
                            class="toggle-btn"
                            :class="{ on: settings[definition.key] }"
                            @click="toggle(definition.key)"
                        >
                            {{ settings[definition.key] ? '开' : '关' }}
                        </button>
                    </div>
                </template>

                <!-- 动画 -->
                <template v-else>
                    <div class="setting-row">
                        <div class="setting-text">
                            <div class="setting-label">动画速度</div>
                            <div class="setting-describe">越大越快，只影响演出快慢，不改变游戏结果</div>
                        </div>
                        <div class="btn-group">
                            <button
                                v-for="option in ANIMATION_SPEED_OPTIONS"
                                :key="option.value"
                                class="group-btn"
                                :class="{ on: settings.animationSpeed === option.value }"
                                :disabled="settings.skipAnimation"
                                @click="settings.animationSpeed = option.value"
                            >
                                {{ option.label }}
                            </button>
                        </div>
                    </div>

                    <div class="setting-row">
                        <div class="setting-text">
                            <div class="setting-label">跳过全部动画</div>
                            <div class="setting-describe">
                                开启后所有演出直接出结果，下面的分类开关一并失效
                            </div>
                        </div>
                        <button
                            class="toggle-btn"
                            :class="{ on: settings.skipAnimation }"
                            @click="settings.skipAnimation = !settings.skipAnimation"
                        >
                            {{ settings.skipAnimation ? '开' : '关' }}
                        </button>
                    </div>

                    <div class="group-label">分类</div>

                    <div
                        v-for="category in animationCategories"
                        :key="category.key"
                        class="setting-row"
                        :class="{ disabled: settings.skipAnimation }"
                    >
                        <div class="setting-text">
                            <div class="setting-label">{{ category.label }}</div>
                            <div class="setting-describe" v-if="category.describe">
                                {{ category.describe }}
                            </div>
                        </div>
                        <button
                            class="toggle-btn"
                            :class="{ on: isCategoryOn(category.key) }"
                            :disabled="settings.skipAnimation"
                            @click="toggleCategory(category.key)"
                        >
                            {{ isCategoryOn(category.key) ? '开' : '关' }}
                        </button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
    settings,
    settingDefinitions,
    resetSettings,
    ANIMATION_SPEED_OPTIONS,
    type BooleanSettingKey
} from '@/core/persistence/settings'
import {
    getAnimationCategories,
    isAnimationCategoryEnabled,
    setAnimationCategoryEnabled
} from '@/ui/animation/categories'

const emit = defineEmits<{
    close: []
}>()

type TabKey = 'general' | 'animation'

const TABS: Array<{ key: TabKey, label: string }> = [
    { key: 'general', label: '通用' },
    { key: 'animation', label: '动画' }
]

const activeTab = ref<TabKey>('general')

// 类别注册表在启动时一次性注册完，面板打开时直接取即可
const animationCategories = getAnimationCategories()

function close() {
    emit('close')
}

function toggle(key: BooleanSettingKey) {
    settings[key] = !settings[key]
}

function isCategoryOn(key: string): boolean {
    return isAnimationCategoryEnabled(key)
}

function toggleCategory(key: string) {
    setAnimationCategoryEnabled(key, !isAnimationCategoryEnabled(key))
}
</script>

<style scoped lang="scss">
.settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.settings-modal {
    position: relative;
    background: #fff;
    border: 2px solid #000;
    width: 480px;
    // 固定高度而不是 max-height：两个 tab 内容长短不一，自适应会让面板在切换时跳一下
    height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;

    h2 {
        margin: 0;
        font-size: 20px;
        color: #000;
    }
}

// 右上角操作区：恢复默认 + 关闭，两个按钮等高对齐
.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.close-btn {
    width: 28px;
    height: 28px;
    border: 2px solid #000;
    background: #fff;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.action-btn {
    height: 28px;
    padding: 0 12px;
    border: 2px solid #000;
    background: #fff;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.divider {
    height: 2px;
    background: #000;
}

// 分栏：选中项反色，和面板里其他按钮同一套视觉语言
.tab-bar {
    display: flex;

    .tab-btn {
        flex: 1;
        padding: 10px 0;
        border: none;
        background: #fff;
        font-size: 14px;
        cursor: pointer;

        &:not(:last-child) {
            border-right: 2px solid #000;
        }

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        &.on {
            background: #333;
            color: #fff;

            &:hover {
                background: #444;
            }
        }
    }
}

.modal-content {
    padding: 0 16px;
    overflow-y: auto;
    flex: 1;

    // 分组小标题：动画分类那一段的表头，只做分隔不占方框
    .group-label {
        padding: 16px 0 8px;
        font-size: 12px;
        color: #666;
    }

    // 一行一项，靠细分隔线区分，不套方框
    .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;

        &:not(:last-child) {
            border-bottom: 1px solid #000;
        }

        // 被总开关压住的分类项：整条变淡，但保留可读性
        &.disabled {
            opacity: 0.4;
        }

        .setting-text {
            .setting-label {
                font-size: 15px;
                font-weight: bold;
            }

            .setting-describe {
                margin-top: 4px;
                font-size: 12px;
                color: #666;
                line-height: 1.4;
            }
        }

        .toggle-btn {
            flex-shrink: 0;
            width: 56px;
            padding: 6px 0;
            border: 2px solid #000;
            background: #fff;
            font-size: 14px;
            cursor: pointer;

            &:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            &.on {
                background: #333;
                color: #fff;

                &:hover {
                    background: #444;
                }
            }

            &:disabled {
                cursor: not-allowed;

                &:hover {
                    background: #fff;
                }

                &.on:hover {
                    background: #333;
                }
            }
        }

        // 连成一排的分段按钮（速度档位等），相邻边框合并成一条
        .btn-group {
            flex-shrink: 0;
            display: flex;

            .group-btn {
                min-width: 44px;
                padding: 6px 0;
                border: 2px solid #000;
                background: #fff;
                font-size: 13px;
                cursor: pointer;

                &:not(:first-child) {
                    border-left: none;
                }

                &:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                &.on {
                    background: #333;
                    color: #fff;

                    &:hover {
                        background: #444;
                    }
                }

                &:disabled {
                    cursor: not-allowed;

                    &:hover {
                        background: #fff;
                    }

                    &.on:hover {
                        background: #333;
                    }
                }
            }
        }
    }
}

</style>
