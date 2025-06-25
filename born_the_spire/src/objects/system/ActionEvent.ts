import { Effect } from "./Effect";
import { Entity } from "./Entity";

// 过程事件指的是游戏进程中发生的每一件事，包括某个对象的行为，以及这些行为产生效果的过程
// 过程事件本身并不影响游戏进程（造成影响的是各个行为和效果）
// 而是记录这件事发生的过程中，涉及到的各个对象
// 并且过程事件还用于触发对象的触发器
// (1.执行行为，2.产生效果)时被构建，并传入触发器中
export class ActionEvent<
    s extends Entity = Entity,
    m extends Entity = Entity,
    t extends Entity = Entity>{
    constructor(
        public key:string,//事件的触发key
        public source:s,//执行该事件的目标
        public medium:m,//
        public target:t,//接受该事件的目标
        public info:Record<string,any>,//该事件执行全程的信息
        public effect?:Effect
    ){}
    //触发这个事件
    triggerEvent(when:"before"|"after"){
        this.source.makeEvent(when,this);
        this.medium.onEvent(when,this)
        this.target.takeEvent(when,this)
    }

}

