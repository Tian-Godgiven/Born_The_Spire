<template>
<div id="popUpContainer" class="popUpContainer" >
    <PopUp :key="popUp.id" v-for="popUp in popUpList" :popUp="popUp"/>
</div>
<Teleport to="body">
	<div id="hoverShowContainer"></div>
</Teleport>
</template>

<script setup lang='ts'>
import { popUpList } from '@/hooks/global/popUp';
import PopUp from './PopUp.vue';

</script>

<style scoped lang='scss'>
//弹窗容器
.popUpContainer{
	z-index: 6;
	position: absolute;
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
//hover弹窗容器
#hoverShowContainer{
	position: absolute;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
	pointer-events: none;
	>*{
		pointer-events: auto;
	}
}
</style>