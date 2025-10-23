import { Target } from "@/core/objects/target/Target";
import mitt from "mitt";

export const eventBus = mitt<Events>()

type Events={
    //鼠标移到某个目标
    "hoverTarget":{
        target:Target,
        callBack:(choosable:boolean)=>void//表示该对象可以被选择时传入true
    }
    //点击某个目标
    "clickTarget":{
        target:Target
    }
}