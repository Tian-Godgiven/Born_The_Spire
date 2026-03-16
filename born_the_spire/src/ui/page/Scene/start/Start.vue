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
</div>
</template>

<script setup lang='ts'>
import { useRouter } from 'vue-router'

const router = useRouter()

const buttonList: { label: string, click: () => void }[] = [
    { label: "开始游戏", click: () => router.push('/setup') }
]
</script>

<style scoped lang='scss'>
.home-page {
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
    gap: 20px;
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
</style>
