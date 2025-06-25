import { Entity } from "@/objects/system/Entity";

//这是一个用来占位的实体对象
//一部分过程事件中
//我们不关心或者找不到特定的实体来参与过程事件的某个部分时，可以使用该对象
export const systemEntity = (function(){
    return new Entity({label:"系统对象"})})()