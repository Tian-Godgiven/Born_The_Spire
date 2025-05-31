<template>
<div class="popUpContainer">
    <PopUp></PopUp>
</div>
</template>

<script setup lang='ts'>
    import PopUp from '@/components/global/PopUp.vue';
import { ref } from 'vue';

</script>

<style scoped lang='scss'>
.popUpContainer{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}
</style>