<template>
<div class="popUp" :style="{zIndex:index}">
    <component :is="innerVue" 
        :popUp="popUp" 
        :returnValue="popUp?.returnValue"
        :props='popUp.props'>
    </component>
</div>
</template>

<script setup lang="ts" name="">
import { shallowRef } from 'vue';
import { PopUp } from '@/ui/hooks/global/popUp'; 
	const {popUp} = defineProps<{popUp:PopUp}>()
	const {index} = popUp
	const innerVue = shallowRef(popUp.vue);

</script>

<style lang="scss" scoped>
.popUp{
	width: 100%;
	height: 100%;
	position: absolute;
	box-sizing: border-box;
	pointer-events: auto;
	overflow:hidden;
	left:50%;
    top:50%;
    transform: translate(-50%,-50%);
}
</style>