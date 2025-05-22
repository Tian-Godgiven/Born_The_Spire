import { reactive, Reactive, ref } from "vue";
import { eventBus } from "./global/eventBus";
import { Target } from "@/objects/target/Target";
type Position = Reactive<{left:number,top:number}|null>
export type ChooseSource = {
    //判断target是否符合条件
    ifTarget?:(target:Target)=>boolean;
    //选中了合适的target时
    hoverTarget?:(target:Target)=>void
    //选择了这个target时
    chooseTarget:(target:Target)=>void
}

//开始选择目标,同一时间仅允许一个选择源,重复触发将会覆盖
export const choosingTarget = ref<boolean>(false)
export function startChooseTarget(source:ChooseSource,position:Position){
    choosingTarget.value = true
    //显示连接线条
    showConnectLine(position)
    //开始监听“鼠标移到target上”事件
    eventBus.on("hoverTarget",({target,callBack})=>{
        if(source.ifTarget){
            callBack(source.ifTarget(target))
        }
        else{
            callBack(true)
        }
    })
    //开始监听“点击Target”事件
    eventBus.on("clickTarget",({target})=>{
        if(source.ifTarget){
            if(source.ifTarget(target)){
                source.chooseTarget(target)
                endChooseTarget()
            }
        }
        else{
            source.chooseTarget(target)
            endChooseTarget()
        }
    })
    //开始监听全局点击事件，如果点击的对象不是target，则结束选择
    setTimeout(()=>{
        document.addEventListener("click",(event)=>{
            event.stopPropagation();
            let target = event.target as HTMLElement
            if(!target.classList.contains('target')){
                
                endChooseTarget()
            }
        },{once:true})
    },0)
}
export function endChooseTarget(){
    ifShowConnectLine.value = false
    eventBus.off("hoverTarget")
    eventBus.off("clickTarget")
}

export const ifShowConnectLine = ref(false)
export let startPosition = ref(reactive({left:0,top:0}))
//显示连接线条
export function showConnectLine(start:Position){
    ifShowConnectLine.value = true;
    if(start){
        startPosition.value = start
    }
}

