import { reactive, Reactive, ref } from "vue";
import { eventBus } from "../../hooks/global/eventBus";
import { Target } from "@/core/objects/target/Target";
import { getSpecificTargetsByTargetType, TargetType } from "@/static/list/registry/chooseTargetType";

type Position = Reactive<{left:number,top:number}|null>
export type ChooseOption = {
    //显示连接线条，默认为true
    showConnectLine?:boolean;
    //判断target是否符合条件
    ifTarget?:(target:Target)=>boolean;
    //选中了合适的target时
    onHover?:(target:Target)=>void;
    //成功选择了某个target时
    onSuccess:(target:Target)=>void;
}

type ChooseRule = {
    faction:"enemy"|"player"|"all",//1.可选目标的阵营：敌人or玩家or不限
    chooseAll:boolean//2.是否为全选
    specificTargets:Target[]//3.是否为特定的某几个目标为可选
    noNeedChoose:boolean//4.当前场上是否可以直接使用卡牌而不需要选中目标
    noValidTargets:boolean//5.当前是否没有可选目标
    chooseNum:number//6.需要进行的选择数量/次数
}

//根据targetType计算当前场上对某次选择行为的规则影响，选择行为会使用这些规则来生成规则框和判断可选对象
export function resolveTargetTypeRules(targetType:TargetType):ChooseRule{
    //特定规则下的目标
    let specificTargets:Target[] = []
    if(targetType.key){
        specificTargets = getSpecificTargetsByTargetType(targetType as Required<TargetType>)
    }
    return {
        faction:targetType?.faction??"all",
        chooseAll:targetType?.number?false:true,
        specificTargets
    }
}

//开始选择目标,同一时间仅允许一个选择源,重复触发将会覆盖
export const choosingTarget = ref<boolean>(false)//正在选择目标
export function startChooseTarget(option:ChooseOption,position:Position,onStop:()=>void){
    choosingTarget.value = true
    //显示连接线条，起点是传入的位置
    if(option.showConnectLine != false){
        showConnectLine(position)
    }
    //开始监听“鼠标移到target上”事件
    eventBus.on("hoverTarget",({target,callBack})=>{
        if(option.ifTarget){
            callBack(option.ifTarget(target))
        }
        else{
            callBack(true)
        }
    })
    //开始监听“点击Target”事件
    eventBus.on("clickTarget",({target})=>{
        if(option.ifTarget){
            if(option.ifTarget(target)){
                option.onSuccess(target)
                endChooseTarget()
            }
        }
        else{
            option.onSuccess(target)
            endChooseTarget()
        }
    })


    //监听器，结束选择
    function handleClick(event:MouseEvent){
        event.stopPropagation();
        let target = event.target as HTMLElement
        if(!target.classList.contains('target') || event.button == 2){
            endChooseTarget()
            onStop()
            removeListeners()
        }
    }
    function handleContextMenu(event:MouseEvent){
        event.preventDefault()
        endChooseTarget()
        onStop()
        removeListeners()
    }
    
    const removeListeners = () => {
        document.removeEventListener("click", handleClick)
        document.removeEventListener("contextmenu", handleContextMenu)
    }

    //开始监听全局点击事件，如果点击的对象不是target或者点击了右键，则结束选择
    setTimeout(()=>{
        document.addEventListener("click", handleClick)
        document.addEventListener("contextmenu", handleContextMenu)
    },0)
    
}
export function endChooseTarget(){
    ifShowConnectLine.value = false
    eventBus.off("hoverTarget")
    eventBus.off("clickTarget")
}


//显示连接线条相关
export const ifShowConnectLine = ref(false)
export let startPosition = ref(reactive({left:0,top:0}))
//显示连接线条,起点是选择源
export function showConnectLine(start:Position){
    ifShowConnectLine.value = true;
    if(start){
        startPosition.value = start
    }
}

