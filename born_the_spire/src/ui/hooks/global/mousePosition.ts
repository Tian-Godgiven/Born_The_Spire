import { reactive } from "vue";

export const mousePosition = reactive({
    left:0,
    top:0
})

export function onMousemove(event:MouseEvent){
    mousePosition.left = event.clientX
    mousePosition.top = event.clientY
}