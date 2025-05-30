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
    width: 100%;
    height: 100%;
}
</style>