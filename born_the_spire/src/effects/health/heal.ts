import { ActionEvent } from "@/objects/system/ActionEvent";
import { changeStatusValue, getStatusValue } from "@/objects/system/Status";

export function healTo(event:ActionEvent,value:number){
    const {source,target,medium} = event
    //修改生命值+value
    const newValue = getStatusValue(target,"health","now") + value
    changeStatusValue(source,medium,target,"health",newValue,"now")
}