<template>
<Teleport to="body">
    <div class="card-flight-layer" :style="{ zIndex: CARD_FLIGHT_Z_INDEX }">
        <CardFlightItem
            v-for="job in flightJobs"
            :key="job.id"
            v-bind="job"
        />
    </div>
</Teleport>
</template>

<script setup lang="ts">
import { CARD_FLIGHT_Z_INDEX } from "@/ui/hooks/interaction/popoverHost"
import { flightJobs } from "@/ui/animation/cardFlight"
import CardFlightItem from "@/ui/animation/components/CardFlightItem.vue"
</script>

<style scoped lang="scss">
.card-flight-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
}
</style>
