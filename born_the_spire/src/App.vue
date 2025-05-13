<template>
  <main class="container">
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

<style scoped>

</style>