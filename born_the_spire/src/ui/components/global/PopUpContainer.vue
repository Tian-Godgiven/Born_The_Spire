<template>
<Teleport to="body">
<div id="popUpContainer" class="popUpContainer" :style="{ zIndex: SHOW_POPUP_Z_INDEX }">
    <PopUp :key="popUp.id" v-for="popUp in popUpList" :popUp="popUp"/>
</div>
</Teleport>
</template>

<script setup lang='ts'>
import { popUpList } from '@/ui/hooks/global/popUp';
import PopUp from './PopUp.vue';
import { SHOW_POPUP_Z_INDEX } from '@/ui/hooks/interaction/popoverHost'

</script>

<style scoped lang='scss'>
//弹窗容器
.popUpContainer{
	position: fixed;
	height: 100%;
	width: 100%;
	top:0;
	left:0;
	pointer-events: none;
    .mask{
		position: absolute;
		top:0;
		left:0;
		height: 100%;
		width: 100%;
		pointer-events: auto;
	}
}
</style>