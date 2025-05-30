<template>
  <main class="main" @mousemove="onMousemove">
    <RouterView></RouterView>
    <PopUpContainer></PopUpContainer>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import router from './router';
import { onMousemove } from './hooks/global/mousePosition';
import PopUpContainer from './page/popUp/PopUpContainer.vue';
onMounted(()=>{
  router.replace("/")
})
</script>

<style>
body{
  margin: 0;
}
.main{
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>