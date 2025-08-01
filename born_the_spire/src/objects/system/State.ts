import { Describe } from "@/hooks/express/describe"
import { Target } from "../target/Target"
import { Entity } from "./Entity"
import { createEffectByMap, doEffect } from "./Effect"
import { stateList } from "@/static/list/target/stateList"
import { newError } from "@/hooks/global/alert"
import { doAction } from "./Behavior"
import { ActionEvent } from "./ActionEvent"

//状态的层数，一部分状态可能拥有多个层数
type Stack = {
    showType?:"number"|"bool"//默认为number
    key:string,
    describe?:Describe
    stack:number//层数
}
const defaultCheckExist = (getter:Target,state:State)=>{
    //检查默认层数是否大于0
    const stack = getStateStack(getter,state.key,"default")
    if(stack && stack > 0){
        return true
    }
    return false
}
export type StateData = {
    label: string, 
    key: string, 
    describe: Describe,
    stacks?: Stack[]|number//只有一个层数对象的情况 
    //在state的层数变化时执行，若返回false则失去该状态，默认值为检测default层数是否大于0
    checkExist?:(getter:Target,state:State)=>boolean,
    showType?: "number" | "bool", 
    repeate?:"stack"|"refresh"|"none"//重复情况
    //状态的行为触发器，获取状态时会为getter添加对应的触发器但作用与state对象上
    behavior?:{
        when:"before"|"after",
        how:"take"|"make"|"on",
        key:string,
        callback:(getter:Target,state:State,event:ActionEvent)=>void
    }[]
}
export type StateMap = StateData & {
    stacks:Stack[]|number
}

//状态对象
export class State{
    public label:string
    public key:string
    public describe:Describe
    public showType:"number"|"bool"="number"//状态显示类型，number会显示状态层数，bool则不会
    public stacks:Stack[]
    public checkExist:(getter:Target,state:State)=>boolean//对应的stack的层数均为0时，会失去该状态
    public repeate:"stack"|"refresh"|"none"="stack"//重复时的效果分别为叠加/覆盖/忽视 
    //注册触发器数组，在获取状态时为获取目标注册这些触发器
    public triggers:{
        when:"before"|"after",
        how:"take"|"make"|"on",
        key:string,
        callback:(getter:Target,state:State,event:ActionEvent)=>void
    }[]
    //注销触发器数组
    public cleanTrigger:(()=>void)[] = []
    constructor(map:StateMap){
        this.label = map.label;
        this.key = map.key;
        this.describe = map.describe;
        this.showType = map.showType ?? "number";
        this.repeate = map.repeate ?? "stack"
        this.checkExist = map.checkExist ?? defaultCheckExist
        this.triggers = map.behavior ?? []
        if(typeof map.stacks == "number"){
            this.stacks = [{key:"default",stack:map.stacks}]
        }
        else{
            this.stacks = map.stacks
        }
    }
    //获取该状态，令目标获得触发器
    getState(target:Target){
        const triggers = this.triggers
        for(let item of triggers){
            const {when,how,key,callback} = item
            //添加行为触发器，触发器的作用目标是该状态对象
            const result = target.getTrigger({
                when,
                how,
                key,
                callback:(event)=>{
                    callback(target,this,event)
                }
            })
            //将注销函数保存在this内
            this.cleanTrigger.push(result.remove)
        }
    }
    //失去该状态，移除获得的触发器
    lostState(){
        //移除所有触发器
        for(let cleaner of this.cleanTrigger){
            cleaner()
        }
    }
}

//创建并返回一个自定义的状态对象
export function createState(map:StateMap){
    return new State(map)
}
//创建一个已有的状态对象
export function createStateByKey(key:string,stacks:Stack[]|number){
    //在list里面寻找该状态对象
    const state = stateList.find(state=>state.key == key)
    //以该状态数据为蓝本创建状态对象
    if(state){
        return new State({
            ...state,
            stacks
        })
    }
    newError(["没有在状态数据表中找到指定的状态",key,stateList])
}

//为目标附加状态
export function addStateToTarget(source:Entity,medium:Entity,target:Entity,state:State){
    //要求目标具备state属性
    if(!('state' in target)){
        newError(["目标target不具备state属性，无法获得状态",target])
    }
    const effect = createEffectByMap({
        label:"附加状态",
        key:"addState",
        targetType:"any",
        value:0,
        effect:()=>{
            //目标会获得这个状态
            getState(source,medium,target as Target,state)
        }
    })
    doEffect(source,medium,target,effect)
}

//目标获得状态对象：状态对象监听对应的目标事件
function getState(source:Entity,medium:Entity,target:Target,state:State){
    //是否已经有这个状态了
    const oldState = target.state.find(tmp=>tmp.key == state.key)
    if(oldState){
        getSameState(oldState)
    }
    else{
        getNewState()
    }
    
    //获得了新的状态
    function getNewState(){
        doAction("getState",source,medium,target,{state},()=>{
            //状态被目标所获得，为目标注册触发器
            state.getState(target)
            //将状态放入目标内
            target.state.push(state)
        })
    }
    //重复获得相同的状态
    function getSameState(oldState:State){
        switch(state.repeate){
            //堆叠层数
            case "stack":
                //遍历层数对象
                for(let stackKey in state.stacks){
                    const oldValue = oldState.stacks[stackKey].stack
                    const newValue = oldValue + state.stacks[stackKey].stack
                    //改变旧对象的层数
                    changeStateStack(newValue,target,state.key,stackKey)
                }
                break;
            //刷新层数
            case "refresh":
                for(let stackKey in state.stacks){
                    const newValue = state.stacks[stackKey].stack
                    changeStateStack(newValue,target,state.key,stackKey)
                }
                break;
            //不改变
            case "none":
                break;
        }
    }
}
//目标失去状态，同时会撤销该状态效果附加的触发器
function lostState(source:Entity,medium:Entity,target:Target,state:State){
    doAction("lostState",source,medium,target,{state},()=>{
        state.lostState()
        //目标失去该状态
        const index = target.state.indexOf(state)
        target.state.splice(index,1)
    })
}

//获取目标的指定状态的指定层数的值
export function getStateStack(target:Target,stateKey:string,stackKey:string="default"){
    const state = target.state.find(state=>state.key == stateKey)
    if(state){
        const stack = state.stacks.find(stack=>stack.key == stackKey)
        if(stack){
            return stack.stack
        }
    }
    return false
}
//修改目标的指定状态的指定层数的值
export function changeStateStack(newValue:number,target:Target,stateKey:string,stackKey:string="default"){
    const state = target.state.find(state=>state.key == stateKey)
    if(state){
        const stack = state.stacks.find(stack=>stack.key == stackKey)
        if(stack){
            stack.stack = newValue
        }
        //判断新层数下该状态是否还可以存在
        if(state.checkExist(target,state)){
            return true
        }
        //目标失去该状态,因层数下降导致的失去状态的来源和媒介都会是自身
        else{
            lostState(target,target,target,state)
        }
    }
    
    return false
}