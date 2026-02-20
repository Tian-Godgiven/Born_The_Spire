import { reactive, ref, ShallowRef } from "vue"
import { nanoid } from "nanoid"

export let popUpList = reactive<PopUp[]>([])
export let maskIndex = ref(0)

export interface PopUp{
	id?:string,//弹窗的唯一性id
	props?:{}, //弹窗的组件中需要使用的数据
	vue:ShallowRef<any>, //弹窗中显示的vue组件
	mask:boolean, //是否显示遮罩层
	returnValue?:(...args: any[])=> void, //用于在弹窗中使用的返回回调事件
    index?:number
}

// 显示弹窗
export function showPopUp(popUp:PopUp){
	//弹窗显示mask
	if(popUp.mask){
		showMask(popUp)
		maskIndex.value += 1
	}

	popUp.id = nanoid()
	
	// 添加弹窗
	popUp["index"] = popUpList.length
	popUpList.push(popUp)
}

// 关闭弹窗
export function closePopUp(popUp?:PopUp){
	// 未指定弹窗时，关闭最外层弹窗
	if(!popUp){
		popUp = popUpList.pop()
	}
	// 删除指定弹窗
	else{
		//找到指定的popUp的index
		const index = popUpList.indexOf(popUp)
		if(index != -1){
			popUpList.splice(index,1)
		}
	}
	
	//如果指定了弹窗并且该弹窗显示了mask
	if(popUp && popUp.mask){
		//从maskPopUp中删除
		const index = maskPopUp.indexOf(popUp)
		maskPopUp.splice(index,1)
		maskIndex.value -= 1
	}

	//已经没有任何弹窗时
	if(maskIndex.value == 0){
		hideMask()
	}
}

// 弹窗的遮罩层
export let ifMask = ref(false)
export let maskAlpha = 0.3
export const maskPopUp:PopUp[] = [] //mask对应的popUp堆栈，每次点击mask都会关闭最外层的popUp

function showMask(popUp:PopUp){
	ifMask.value = true
	maskPopUp.push(popUp)
}
function hideMask(){
	ifMask.value = false
}
//关闭最外层的弹窗
export function clickMask(){
	const tmp = maskPopUp.pop()
	closePopUp(tmp)
}
