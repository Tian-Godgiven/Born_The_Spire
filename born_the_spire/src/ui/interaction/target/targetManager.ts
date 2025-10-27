// targetManager.ts
import { Target } from '@/core/objects/target/Target'
import { newLog } from '@/ui/hooks/global/log'
import { reactive, readonly } from 'vue'
import { choosingTarget } from './chooseTarget'
import { nowBattle } from '@/core/objects/game/battle'

export interface TargetChooseState {
  isSelectable: boolean,//可选：会为其生成一个选择框
  isHovered: boolean,//悬停状态：选择框高亮
  isSelected: boolean,//已选中：选择框高亮+固定
}

const initState = {
    isSelectable:false,
    isHovered:false,
    isSelected:false
}

class TargetManager {
  // 当前场上的目标
  private targets = reactive(new Map<string, {target:Target,chooseState:TargetChooseState}>())
  // 当前场上的阵营
  private factions = reactive(new Map<string,{chooseState:TargetChooseState}>([
    ["player",{chooseState:{...initState}}],
    ["enemy",{chooseState:{...initState}}],
    ["all",{chooseState:{...initState}}],
  ]))
  // 添加目标到场上
  addTarget(target: Target){
    const selectableEntity = {
      target,
      chooseState:{...initState}
    }
    
    this.targets.set(target.__id, selectableEntity)
    newLog([target,"进入战斗"])
    return selectableEntity
  }
  
  // 从场上移除目标
  removeTarget(target:Target): boolean {
    const id = target.__id
    const val = this.targets.delete(id)
    if (val) {
        newLog([target,"离开战场"])
    }
    return val
  }

  //添加阵营到场上
  addFaction(factionKey:string){
    const selectableFaction = {chooseState:{...initState}}
    this.factions.set(factionKey,selectableFaction)
    return selectableFaction
  }
  //移除指定阵营
  removeFaction(factionKey:string){
    this.factions.delete(factionKey)
  }
  
  // 获取所有场上目标及其状态
  getAllTargets(){
    return readonly(this.targets)
  }
  
  // 获取特定目标
  getTarget(id: string){
    const target = this.targets.get(id)
    if(target){
        return readonly(target)
    }
    return null
  }
  getFaction(name:string){
    return this.factions.get(name)
  }
  
  // 设置目标为可选状态
  setSelectableTargets(targets:Target[]) {
    //要求当前处于选择状态
    if(choosingTarget.value == false){
        console.error("当前未处于选择状态")
        return
    }
    this.clearAllSelection()
    targets.forEach(target => {
        const t = this.targets.get(target.__id)
        if(t){
            t.chooseState.isSelectable = true
        }
    })
  }

  //设置目标的某个选择状态
  setTargetState(target:Target,state:keyof TargetChooseState,value:boolean){
    const t = this.targets.get(target.__id)
    if(t){
        t.chooseState[state] = value
    }
  }
  //选择某个阵营
  setFactionState(key:string,state:keyof TargetChooseState,value:boolean){
    const f = this.factions.get(key)
    if(f){
        f.chooseState[state] = value
    }
  }
  
  // 停止选择,清空所有已选择对象的状态
  stopSelection(): Target[] {
    const selectedEntities = this.getSelectedEntities()
    this.targets.forEach(target => {
      target.chooseState = {...initState}
    })
    return selectedEntities
  }
  
  // 获取已选择的目标（返回原始对象，剥离选择状态）
  getSelectedEntities(): Target[] {
    //如果某个阵营被选中，则返回该阵营下的所有对象
    for(let [key,faction] of this.factions){
        if(faction.chooseState.isSelected){
            if(key === "all"){
                const players = nowBattle.value?.getTeam("player") ?? []
                const enemies = nowBattle.value?.getTeam("enemy") ?? []
                return [...players,...enemies]
            }
            else{
                //未完成：阵营注册器
                return nowBattle.value?.getTeam(key as "player"|"enemy")?? []
            }
        }
    }
    //否则返回选中的目标
    return Array.from(this.targets.values())
      .filter(target => target.chooseState.isSelected)
      .map(t=>t.target)
  }
  
  // 清空所有选择状态
  private clearAllSelection() {
    this.targets.forEach(target => {
      target.chooseState = {...initState}
    })
  }

}

// 单例导出
export const targetManager = new TargetManager()