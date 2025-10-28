import { Reactive, ref } from "vue";
import { Target } from "@/core/objects/target/Target";
import { getSpecificTargetsByTargetType, TargetType } from "@/static/list/registry/chooseTargetType";
import { nowBattle } from "@/core/objects/game/battle";
import { targetManager } from "./targetManager";
import { newError } from "@/ui/hooks/global/alert";
import { nanoid } from "nanoid";
import { mousePosition } from "@/ui/hooks/global/mousePosition";

type Position = Reactive<{left:number,top:number}|null>
export type ChooseOption = {
    //本次选择行为的交互要求
    targetType:TargetType,
    //是否显示连接线条，默认为true
    ifShowConnectLine?:boolean;
    //选中了合适的target时
    onHover?:(target:Target)=>void;
    //成功完成某次选择时
    onSuccess:(targets:Target[])=>void;
    //无论成功与否结束某次选择时
    onStop?:(targets:Target[])=>void
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
const initChooseAction = {
    chosenTargets:[],
    chooseRule:null,
    onSuccess:null,
    onStop:null
}
export const nowChooseAction = ref<{
    chosenTargets:Target[],
    chooseRule:ChooseRule|null,
    onSuccess:null|((targets:Target[])=>void);
    onStop:null|((targets:Target[])=>void)
}>({...initChooseAction})
export const choosingTarget = ref<boolean>(false)//当前的选择状态
function initStartChooseTarget(){
    ifShowConnectLine.value = false
    choosingTarget.value = true;
    nowChooseAction.value = {...initChooseAction}
}

export function startChooseTarget(option:ChooseOption,position:Position){
    //初始化开始选择状态
    initStartChooseTarget()
    const {targetType,onSuccess,onStop=()=>{},ifShowConnectLine} = option
    //解析选择规则
    const rule = resolveTargetTypeRules(targetType)
    //按规则设置可选框
    setChooseAbleBlock(rule)
    nowChooseAction.value = {
        chosenTargets:[],
        chooseRule:rule,
        onSuccess,
        onStop:onStop,
    }

    //显示连接线条，起点是传入的位置
    if(ifShowConnectLine != false){
        showConnectLine(position)
    }

    //开始监听局外点击事件
    startListenClick(onStop)
}
//选择完成
export function successChooseTarget(){
    //触发选择成功回调函数
    if(nowChooseAction.value.onSuccess){
        nowChooseAction.value.onSuccess([...nowChooseAction.value.chosenTargets])
    };
    //结束选择
    endChooseTarget()
}
//结束or取消选择
export function endChooseTarget(){
    //触发结束回调
    if(nowChooseAction.value.onStop){
        nowChooseAction.value.onStop([...nowChooseAction.value.chosenTargets])
    }
    //清除选择框
    targetManager.stopSelection()
    initStartChooseTarget()
}

//在本次选择中选中了一个目标
export function chooseATarget(target:Target){
    const nowChooseRule = nowChooseAction.value.chooseRule;
    const chosenTargets = nowChooseAction.value.chosenTargets
    if(!nowChooseRule){
        newError(["当前不处于选择状态中，无法选择目标。"])
        return;
    }
    chosenTargets.push(target)
    //判断是否继续选择:选择数量是否达标
    const chosenNum = chosenTargets.length;
    const needNum = nowChooseRule.needChooseNum;
    if(chosenNum == needNum){
        successChooseTarget()
    }
    else{
        //固定当前选择
        staticConnectLine()
    }
}
//在本次选中选中了一个阵营(其中的所有目标)
export function chooseAFaction(targets:Target[]){
    const nowChooseRule = nowChooseAction.value.chooseRule;
    const chosenTargets = nowChooseAction.value.chosenTargets
    if(!nowChooseRule){
        newError(["当前不处于选择状态中，无法选择目标。"])
        return;
    }
    chosenTargets.push(...targets)
    //判断是否继续选择:选择数量是否达标
    const chosenNum = chosenTargets.length;
    const needNum = nowChooseRule.needChooseNum;
    if(chosenNum == needNum){
        successChooseTarget()
    }
    else{
        //固定当前选择
        staticConnectLine()
    }
}
//自动选择目标
function autoChooseTarget(){
    //自动获取场上的对象
    tmp()
    //完成选择
    successChooseTarget()
    function tmp(){
        //获取当前规则指定的可选对象
        const rule = nowChooseAction.value.chooseRule;
        if(!rule){
            newError(["当前没有指定的选择规则"])
            return;
        }
        const specificTargets = rule.specificTargets;
        if(specificTargets){
            nowChooseAction.value.chosenTargets = [...specificTargets]
            return;
        }
        //否则根据当前阵营获得可选对象
        const faction = rule.faction;
        if(faction == "all"){
            const e = nowBattle.value?.getTeam("enemy") ?? [];
            const p = nowBattle.value?.getTeam("player") ?? []
            nowChooseAction.value.chosenTargets = [...e,...p]
            return;
        }
        const targets = nowBattle.value?.getTeam(faction) ?? [];
        nowChooseAction.value.chosenTargets = [...targets]
        return
    }
    

}


//显示连接线条相关

export const ifShowConnectLine = ref(false)
export let startPosition = ref({left:0,top:0})// 当前的链接线条
export const staticLines = ref<{id:string,start:Position,end:Position}[]>([])// 固定的链接线条列表
//显示连接线条,起点是选择源
export function showConnectLine(start:Position){
    ifShowConnectLine.value = true;
    if(start){
        startPosition.value = start
    }
}
//固定当前链接线条
function staticConnectLine(){
    const nowLine = {
        id:nanoid(),
        start:{...startPosition.value},
        end:{...mousePosition}
    }
    staticLines.value.push(nowLine)
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
function startListenClick(onStop:(targets:Target[])=>void){
    //左键点击
    function handleClick(event:MouseEvent){
        event.stopPropagation();
        let target = event.target as HTMLElement
        //点击到了非目标元素时
        if(!target.classList.contains('target') || event.button == 2){
            //如果不需要选择目标的话
            if(nowChooseAction.value.chooseRule?.noNeedChoose){
                autoChooseTarget()
            }
            endChooseTarget()
            onStop([...nowChooseAction.value.chosenTargets])
            removeListeners()
        }
    }
    function handleContextMenu(event:MouseEvent){
        event.preventDefault()
        endChooseTarget()
        onStop([...nowChooseAction.value.chosenTargets])
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
