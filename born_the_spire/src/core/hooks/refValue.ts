import { isRef, Ref } from "vue";

export function getRefValue(refValue:Ref|any){
    if(isRef(refValue)){
        return refValue.value
    }
    return refValue
}

export function setRefValue(obj:Record<string,any>,key:string,newValue:any){
    const refValue = obj[key]
    if(isRef(refValue)){
        refValue.value = newValue
    }
    else{
        obj[key] = newValue
    }
}