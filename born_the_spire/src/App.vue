<template>
  <main class="main">
    <RouterView></RouterView>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import router from './router';
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