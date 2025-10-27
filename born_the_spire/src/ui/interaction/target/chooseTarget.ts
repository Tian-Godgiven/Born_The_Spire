import { reactive, Reactive, ref } from "vue";
import { eventBus } from "../../hooks/global/eventBus";
import { Target } from "@/core/objects/target/Target";
import { getSpecificTargetsByTargetType, TargetType } from "@/static/list/registry/chooseTargetType";
import { nowBattle } from "@/core/objects/game/battle";
import { targetManager } from "./targetManager";

type Position = Reactive<{left:number,top:number}|null>
export type ChooseOption = {
    //本次选择行为的交互要求
    targetType:TargetType,
    //显示连接线条，默认为true
    ifShowConnectLine?:boolean;
    //判断target是否符合条件
    ifTarget?:(target:Target)=>boolean;
    //选中了合适的target时
    onHover?:(target:Target)=>void;
    //成功选择了某个target时
    onSuccess:(target:Target)=>void;
}

type ChooseRule = {
    specificTargets:Target[]|null//3.是否为特定的某几个目标为可选，优先级最高,高优先级会覆盖低优先级
    faction:"enemy"|"player"|"all",//1.可选目标的阵营：敌人or玩家or不限
    chooseAll:boolean//2.是否为全选，优先级次之
    noNeedChoose:boolean//4.当前场上是否可以直接使用卡牌而不需要选中目标
    noValidTargets:boolean//5.当前是否没有可选目标
    needChooseNum:number//6.需要进行的选择数量/次数，优先级最低
}

//根据targetType计算当前场上对某次选择行为的规则影响，选择行为会使用这些规则来生成规则框和判断可选对象
export function resolveTargetTypeRules(targetType:TargetType):ChooseRule{
    //特定规则下的目标
    let specificTargets:Target[]|null = null
    if(targetType?.key){
        specificTargets = getSpecificTargetsByTargetType(targetType as Required<TargetType>)
    }
    //是否无需选中目标
    const {noNeedChoose,noValidTargets,needChooseNum} = checkChooseNum(targetType,specificTargets)
    //是否没有可选目标
    
    return {
        faction:targetType?.faction??"all",
        chooseAll:targetType?.number == "all"?true:false,
        specificTargets: specificTargets,
        noNeedChoose,
        noValidTargets,
        needChooseNum
    }
}

//判断是否无需选择目标 and 是否没有可选目标
function checkChooseNum(targetType:TargetType,specificTargets:Target[]|null){
    //可选数量
    let chooseAbleNum = 0
    if(specificTargets){
        chooseAbleNum = specificTargets.length
    }
    //场上指定阵营的对象数量
    else if(targetType.faction == "all"){
        chooseAbleNum = (nowBattle.value?.getTeam("player")?.length ?? 0) + (nowBattle.value?.getTeam("enemy")?.length ?? 0)
    }
    else{
        chooseAbleNum = nowBattle.value?.getTeam(targetType.faction ?? "enemy")?.length ?? 0
    }
    
    
    let needChooseNum = 0
    let noNeedChoose = false
    //选中所有目标
    if(targetType.number === "all"){
        noNeedChoose = true
        needChooseNum = 1
    }
    else{
        let targetChooseNum = targetType.number ?? 1
        //目标数量=可选数量=1时，无需选中这一个目标
        if(chooseAbleNum == 1 && targetChooseNum == chooseAbleNum){
            noNeedChoose = true
            needChooseNum = 1
        }
        //否则，需要选择的数量为较小的一方
        else{
            needChooseNum = targetChooseNum >= chooseAbleNum ? chooseAbleNum:targetChooseNum
        }
    }

    return {
        noNeedChoose,
        noValidTargets:chooseAbleNum == 0,
        needChooseNum
    }
}

//开始选择目标,同一时间仅允许一个选择源,重复触发将会覆盖
export const choosingTarget = ref<boolean>(false)//正在选择目标
export function startChooseTarget(option:ChooseOption,position:Position,onStop:()=>void){
    const {targetType,ifShowConnectLine} = option
    //解析选择规则
    const rule = resolveTargetTypeRules(targetType)
    setChooseAbleBlock(rule)

    choosingTarget.value = true
    //显示连接线条，起点是传入的位置
    if(ifShowConnectLine != false){
        showConnectLine(position)
    }
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

    //开始监听局外点击事件
    startListenClick(onStop)
    
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



//根据规则，设置可选目标/可选框
function setChooseAbleBlock(rule:ChooseRule){
    //根据规则优先级，设定场上的对象为可选状态
    if(rule.specificTargets){
        //只有这些对象是可选的
        targetManager.setSelectableTargets(rule.specificTargets)
    }
    //全选：可选对象为阵营框
    else if(rule.chooseAll){
        //根据阵营，设定阵营为可选状态
        targetManager.setFactionState(rule.faction,"isSelected",true)
    }
    //最低优先度：阵营的所有对象为可选对象
    else{
        let targets:Target[] = []
        //未完成：阵营注册器
        switch(rule.faction){
            case "player":
                targets = nowBattle.value?.getTeam("player") ?? []
                break;
            case "enemy":
                targets = nowBattle.value?.getTeam("enemy") ?? []
                break;
            case "all":
                targets = [...nowBattle.value?.getTeam("player") ?? [],...nowBattle.value?.getTeam("enemy") ?? []]
                break;
        }
        targetManager.setSelectableTargets(targets)
    }
}
//开始监听点击事件以取消选择状态
function startListenClick(onStop:()=>void){
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
