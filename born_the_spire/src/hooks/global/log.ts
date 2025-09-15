import dayjs from "dayjs";
import { isNumber, isString } from "lodash";
import { ref } from "vue";

export const logList = ref<LogUnit[]>([])

export type LogUnit = {
    text:string,//直接在日志栏中输出的内容
    detail:string,//在日志栏中作为上述内容的折叠内容，点一下才会显示(再点一下收起)
    time:number
}

export type LogData = {
    main:any[],//主內容
    detail:any[]//详情內容
}
//在日志栏打印内容
export function newLog(logData:LogData|any[]){
    const logUnit:LogUnit = {
        text:"",
        detail:"",
        time:dayjs().valueOf()
    }
    if("main" in logData){
        for(let i of logData.main){
            logUnit.text += handleLogData(i)
        }
        for(let j of logData.detail){
            logUnit.detail += handleLogData(j)
        }
    }
    else{
        for(let i of logData){
            logUnit.text += handleLogData(i)
        }
    }
    
    logList.value.push(logUnit)
}

//处理得到的日志数据，返回赋给日志单元的值
function handleLogData(logData:any){
    if(logData==null){
        return "<未定义对象>"
    }
    else if(logData?.label || logData?.key){
        return logData?.label ?? logData.key
    }
    else if(isString(logData)||isNumber(logData)){
        return logData
    }
    else{
        return "<无法识别对象>"
        // logString += JSON.stringify(i)
    }
}