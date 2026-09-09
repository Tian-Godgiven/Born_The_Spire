<template>
<div class="cardPile">
    <Mask></Mask>
    <div class="container">
        <div class="cards">
            <div
                class="card-inspect"
                v-for="card in cardPile"
                :key="card.__id"
                @click.stop="showCardDetail(card)"
            >
                <CardVue :card="card" />
            </div>
        </div>
        <div class="close" @click="closePopUp(popUp)">关闭</div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import type { Card } from '@/core/objects/item/Subclass/Card';
    import CardVue from '@/ui/components/object/Card.vue';
    import { closePopUp } from '@/ui/hooks/global/popUp';
    import type { PopUp } from '@/ui/hooks/global/popUp';
    import Mask from '@/ui/components/global/Mask.vue';
    import { showCardDetail } from '@/ui/hooks/interaction/cardDetail';
    const {popUp,props} = defineProps<{popUp:PopUp,props:{cardPile:Card[]}}>()
    const {cardPile} = props
</script>

<style scoped lang='scss'>
.cardPile{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .container{
        padding: 10px;
        // width: 70%;
        height: 60%;
        position: absolute;
        .cards{
            display: grid;
            grid-template-columns: repeat(7,auto);
            gap: 10px;
            align-content: flex-start;
        }
        .card-inspect{
            cursor: pointer;
        }
        .close{
            width: 100px;
            height: 50px;
            background-color: white;
            position: absolute;
            right: 20px;
            bottom: 20px;
        }
    }
}
</style>