<template>
    <Teleport to="body">
        <div class="changelog-overlay" @click.self="close">
            <section class="changelog-modal" role="dialog" aria-modal="true" aria-labelledby="changelog-title">
                <header class="modal-header">
                    <h2 id="changelog-title">更新日志</h2>
                    <button class="close-btn" type="button" aria-label="关闭更新日志" @click="close">×</button>
                </header>

                <div class="version-list">
                    <article v-for="version in changelogVersions" :key="version.version" class="version-entry">
                        <button
                            class="version-toggle"
                            type="button"
                            :aria-expanded="expandedVersion === version.version"
                            @click="toggleVersion(version.version)"
                        >
                            <span>v{{ version.version }}</span>
                            <span class="toggle-mark">{{ expandedVersion === version.version ? '收起' : '展开' }}</span>
                        </button>

                        <div v-if="expandedVersion === version.version && activeEntry?.version === version.version" class="version-content">
                            <section>
                                <h3>新增与调整</h3>
                                <ul>
                                    <li v-for="system in activeEntry.systems" :key="system">{{ system }}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>问题修复</h3>
                                <p class="fix-thanks">感谢所有贡献者的反馈，是你们让这款游戏变得越来越好，爱你们(　ﾟ 3ﾟ)！</p>
                                <div class="fix-list" role="list">
                                    <div v-for="fix in activeEntry.fixes" :key="fix.summary" class="fix-row" role="listitem">
                                        <span class="fix-summary">{{ fix.summary }}</span>
                                        <span class="fix-contributor">{{ fix.contributor }}</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3>下一版本</h3>
                                <ul>
                                    <li v-for="item in activeEntry.roadmap.next" :key="item">{{ item }}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>后续计划</h3>
                                <ul>
                                    <li v-for="item in activeEntry.roadmap.later" :key="item">{{ item }}</li>
                                </ul>
                            </section>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { changelogVersions, type ChangelogEntry } from '@/static/changelog'

const emit = defineEmits<{ close: [] }>()
const expandedVersion = ref('')
const activeEntry = ref<ChangelogEntry | null>(null)

function close() {
    emit('close')
}

async function toggleVersion(version: string) {
    if (expandedVersion.value === version) {
        expandedVersion.value = ''
        activeEntry.value = null
        return
    }

    const versionDefinition = changelogVersions.find(item => item.version === version)
    if (!versionDefinition) return

    expandedVersion.value = version
    activeEntry.value = null
    const entry = await versionDefinition.load()
    if (expandedVersion.value === version) {
        activeEntry.value = entry
    }
}

onMounted(() => {
    const latestVersion = changelogVersions[0]?.version
    if (latestVersion) void toggleVersion(latestVersion)
})
</script>

<style scoped lang="scss">
.changelog-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.5);
}

.changelog-modal {
    display: flex;
    flex-direction: column;
    width: min(680px, 100%);
    max-height: min(760px, 88vh);
    overflow: hidden;
    border: 2px solid #000;
    background: #fff;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 2px solid #000;

    h2 {
        margin: 0;
        font-size: 20px;
    }
}

.close-btn {
    width: 28px;
    height: 28px;
    border: 2px solid #000;
    background: #fff;
    color: #000;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;

    &:hover {
        background: #eee;
    }
}

.version-list {
    overflow-y: auto;
}

.version-entry + .version-entry {
    border-top: 2px solid #000;
}

.version-toggle {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    border: 0;
    background: #fff;
    color: #000;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;

    &:hover {
        background: #eee;
    }
}

.toggle-mark {
    font-size: 12px;
    font-weight: normal;
}

.version-content {
    padding: 0 16px 18px;

    section + section {
        margin-top: 18px;
    }

    h3 {
        margin: 0 0 8px;
        font-size: 15px;
    }

    ul {
        display: grid;
        gap: 6px;
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        line-height: 1.5;
    }
}

.fix-list {
    border-top: 1px solid #000;
}

.fix-thanks {
    padding: 8px;
    border:1px solid black;
    background-color: black;
    color: white;

    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.5;
}

.fix-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #000;
    font-size: 13px;
    line-height: 1.45;
}

.fix-contributor {
    padding-left: 12px;
    border-left: 1px solid #000;
    text-align: right;
    font-weight: bold;
    overflow-wrap: anywhere;
}

@media (max-width: 600px) {
    .changelog-overlay {
        align-items: flex-end;
        padding: 12px;
    }

    .changelog-modal {
        max-height: 82vh;
    }

    .version-content {
        padding: 0 12px 14px;
    }

    .fix-row {
        grid-template-columns: minmax(0, 1fr) 82px;
        gap: 8px;
        font-size: 12px;
    }

    .fix-contributor {
        padding-left: 8px;
    }
}
</style>
