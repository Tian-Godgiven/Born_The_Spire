import { ActionEvent } from "@/objects/system/ActionEvent";
import { Entity } from "@/objects/system/Entity";

//进行一个行为
export function doBehavior(
    key:string,
    source:Entity,
    medium:Entity,
    target:Entity
){
    //创建行为事件
    const event = new ActionEvent(key,source,medium,target)
    //触发行为事件
    event.triggerEvent("before")
    event.triggerEvent("after")
}