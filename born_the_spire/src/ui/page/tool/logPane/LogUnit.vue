<template>
<div class="log" :style="{marginLeft: (log.level || 0) * 15 + 'px'}">
        <!-- 主内容行 -->
        <div class="text"
            @click="toggleExpand"
            :class="hasChildren || log.detail ? 'clickable' : ''">
            <!-- 时间戳 -->
            <span v-show="showTime" class="time">[{{ dayjs(log.time).format("HH:mm:ss SSS") }}]</span>

            <!-- 展开/收起箭头（控制子日志和详情），有子日志时蓝色，无子日志时黑色 -->
            <span v-if="hasChildren || log.detail"
                class="expand-icon"
                :class="hasChildren ? 'has-children' : ''">
                {{ expanded ? '▼' : '▶' }}
            </span>

            <!-- 日志文本 -->
            {{ log.text }}
        </div>

        <!-- 详情内容（detail） -->
        <div class="detail" v-show="expanded && log.detail">{{ log.detail }}</div>

        <!-- 子日志（递归渲染） -->
        <div v-show="expanded && hasChildren" class="children">
            <LogUnit
                v-for="(child, index) in log.children"
                :key="child.time + '-' + index"
                :log="child"
                :showTime="showTime"
            />
        </div>
    </div>
</template>

<script setup lang='ts'>
import type { LogUnit } from '@/ui/hooks/global/log';
import dayjs from 'dayjs';
import { computed, ref } from 'vue';
    const {log,showTime} = defineProps<{log:LogUnit,showTime:boolean}>()

    // 统一的展开状态（控制子日志和详情）
    const expanded = ref(false)

    // 是否有子日志
    const hasChildren = computed(() => log.children && log.children.length > 0)

    // 切换展开/收起
    function toggleExpand(){
        if(hasChildren.value || log.detail){
            expanded.value = !expanded.value
        }
    }
</script>

<style scoped lang='scss'>
.log{
    margin: 5px 0;
    overflow: visible;
    user-select: all;

    .text{
        &.clickable{
            cursor: pointer;
            padding: 2px 5px;
            box-sizing: border-box;
            border: 1px solid rgb(213, 213, 213);
            border-radius: 5px;
            background-color: rgb(252, 252, 252);

            &:hover{
                background-color: rgb(245, 245, 245);
            }
        }
    }

    .expand-icon{
        color: black;
        font-weight: bold;
        margin-right: 3px;
        user-select: none;

        &.has-children{
            color: rgb(100, 100, 255);
        }
    }
}

.time{
    background-color: white;
    color: rgb(146, 146, 146);
    font-size: 14px;
    margin-right: 5px;
}

.detail{
    margin-left: 20px;
    color: rgb(100, 100, 100);
    font-size: 13px;
    padding: 5px;
    background-color: rgb(250, 250, 250);
    border-left: 2px solid rgb(220, 220, 220);
}

.children{
    margin-top: 3px;
}
</style>