<template>
<div class="log" :style="{marginLeft: (log.level || 0) * 15 + 'px'}">
        <!-- 主内容行 -->
        <div class="text"
            @click="toggleChildren"
            :class="hasChildren || log.detail ? 'clickable' : ''">
            <!-- 时间戳 -->
            <span v-show="showTime" class="time">[{{ dayjs(log.time).format("HH:mm:ss SSS") }}]</span>

            <!-- 子日志展开/收起箭头 -->
            <span v-if="hasChildren" class="expand-icon">{{ childrenExpanded ? '▼' : '▶' }}</span>

            <!-- 详情展开/收起箭头（独立点击） -->
            <span v-if="log.detail" class="detail-icon" @click.stop="toggleDetail">
                {{ detailExpanded ? '▲' : '▼' }}
            </span>

            <!-- 日志文本 -->
            {{ log.text }}
        </div>

        <!-- 详情内容（detail） -->
        <div class="detail" v-show="detailExpanded">{{ log.detail }}</div>

        <!-- 子日志（递归渲染） -->
        <div v-show="childrenExpanded" class="children">
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

    // 详情展开状态
    const detailExpanded = ref(false)
    // 子日志展开状态（默认折叠）
    const childrenExpanded = ref(false)

    // 是否有子日志
    const hasChildren = computed(() => log.children && log.children.length > 0)

    // 切换子日志展开/收起
    function toggleChildren(){
        if(hasChildren.value){
            childrenExpanded.value = !childrenExpanded.value
        }
    }

    // 切换详情展开/收起
    function toggleDetail(){
        detailExpanded.value = !detailExpanded.value
    }
</script>

<style scoped lang='scss'>
.log{
    margin: 5px 0;
    overflow: visible;

    .text{
        &.clickable{
            cursor: pointer;
            padding: 2px 5px;
            box-sizing: border-box;
            user-select: none;
            border: 1px solid rgb(213, 213, 213);
            border-radius: 5px;
            background-color: rgb(252, 252, 252);

            &:hover{
                background-color: rgb(245, 245, 245);
            }
        }
    }

    .expand-icon{
        color: rgb(100, 100, 255);
        font-weight: bold;
        margin-right: 3px;
    }

    .detail-icon{
        color: rgb(150, 150, 150);
        margin-right: 3px;
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