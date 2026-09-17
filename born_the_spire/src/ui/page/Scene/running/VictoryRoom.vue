<template>
<div class="victory-room">
    <div class="victory-content">
        <div class="victory-title">未完待续</div>

        <div class="victory-letter">
            <p>谢谢你愿意玩到这里。</p>
            <p>目前这一版 Demo 只做完了第一层，后面的层还在做。</p>
            <p>如果你有兴趣一起参与之后的制作，欢迎来 QQ 群：<span class="qq">{{ qqGroup }}</span></p>
            <p>如果你在游戏过程中遇到了设计不合理/数值变态/单纯的Bug都可以来群里反馈！</p>
        </div>

        <div class="actions">
            <Button :click="handleRestart" label="再来一发" />
            <Button :click="handleBackToMainMenu" label="返回主菜单" />
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { restartRun, backToMainMenu } from '@/core/hooks/game'
import { QQ_GROUP } from '@/ui/hooks/global/creatorEasterEgg'
import Button from '@/ui/components/global/Button.vue'

const qqGroup = QQ_GROUP

async function handleRestart() {
    await restartRun()
}

async function handleBackToMainMenu() {
    await backToMainMenu()
}
</script>

<style scoped lang="scss">
.victory-room {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.victory-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    padding: 40px 36px;
    max-width: 520px;
    background: white;
    border: 2px solid black;
}

.victory-title {
    font-size: 32px;
    font-weight: bold;
}

.victory-letter {
    font-size: 16px;
    line-height: 1.7;
    text-align: left;
    width: 100%;

    p {
        margin: 0 0 12px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

.qq {
    font-weight: bold;
    user-select: all;
}

.actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
}
</style>
