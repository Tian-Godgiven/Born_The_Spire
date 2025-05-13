import { Enemy } from "./Enemy";
import { Player } from "./Player";

export class Potion{
    constructor(
        public readonly label:string,
        public readonly key:string,
        private use:(target:Player|Enemy)=>void,
        private targetType:"player"|"enemy"|"all",
        private discard?:(player:Player,Enemy:Enemy)=>void,
    ){}
    //选中某个目标
    focus(target:Player|Enemy){
        if(this.targetType == "player"){
            if(target instanceof Player){
                return true
            }
        }
        if(this.targetType == "enemy"){
            if(target instanceof Enemy){
                return true
            }
        }
        if(this.targetType == "all"){
            return true
        }
        return false
    }
    //作用到指定目标
    effectTo(target:Player|Enemy){
        this.use(target)
    }
}