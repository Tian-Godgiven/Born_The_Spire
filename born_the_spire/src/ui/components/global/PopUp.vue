<template>
<Transition name="popup-fade" appear>
    <div class="popUp" :style="{zIndex:index}">
        <component :is="innerVue"
            :popUp="popUp"
            :returnValue="popUp?.returnValue"
            :props='popUp.props'>
        </component>
    </div>
</Transition>
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

// 渐显动画
.popup-fade-enter-active {
	transition: opacity 0.3s ease, transform 0.3s ease;
}

.popup-fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.popup-fade-enter-from {
	opacity: 0;
	transform: translate(-50%,-50%) scale(0.95);
}

.popup-fade-leave-to {
	opacity: 0;
	transform: translate(-50%,-50%) scale(0.95);
}
</style>