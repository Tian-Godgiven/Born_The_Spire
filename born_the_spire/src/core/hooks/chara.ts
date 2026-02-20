import { ActionEvent, doEvent } from "../objects/system/ActionEvent";
import { Organ } from "../objects/target/Organ";
import { Chara } from "../objects/target/Target";

// 杀死角色
export function kill(event:ActionEvent,target:Chara|Organ,info?:{reason:string}){
    doEvent({
        key:"kill",
        target,
        source:event.source,
        medium:event.medium,
        info
    })
}