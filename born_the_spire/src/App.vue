<template>
  <main class="main" @mousemove="onMousemove">
    <div class="router">
      <RouterView></RouterView>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import router from './ui/router';
import { onMousemove } from './ui/hooks/global/mousePosition';
onMounted(()=>{
    router.replace("/")
})
</script>

<style lang="scss">
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