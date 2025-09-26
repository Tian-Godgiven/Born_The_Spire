# 触发器 Trigger

触发器是绑定在实体Entity上，对一个过程事件ActionEvent/效果Effect的宣布做出响应，执行一系列回调函数对象。

在某个过程事件/效果被宣布时，会对参与该过程事件的来源Source，媒介Medium，目标Target触发与该过程事件的key相同的触发器，并调用触发器所包含的回调函数。

## 获取

触发器一般有两种获取方式
1.主动获得：在对象创建的过程中，会通过其数据文件中的trigger关键字生成触发器，这些触发器会自动绑定到该对象上
2.被动获得：通过“附加触发器”效果，在事件中为目标添加效果指定的触发器对象

## 起效

触发器在响应时，会创建一个这样的触发事件

source: 为对象绑定触发器的来源
medium：持有该触发器的对象
target：在触发器创建时设置，包含以下选项
    "eventSource"：响应的事件的source对象
    "eventMedium"：响应的事件的medium对象
    "eventTarget"：响应的事件的target对象
    "triggerHover"：持有该触发器的对象
    "triggerSource"：为对象绑定触发器的来源对象
    Entity：某个设定的对象，这通常需要你直接创建一个触发器，而不是通过triggerMap来实现

事件的其他属性均可以在触发器被创建时设置，例如key,label等

## 结构

触发器通过【触发时机when】，【触发机制how】和【触发关键词key】分类，结构如下
{
    before:{
        make:{
            key:TriggerItem[]
        },
        by:同上,
        take:同上,
    }
    after:同上
}


### 触发组

TriggerGroup/触发组是触发器中的一个结构，其包含触发器的触发关键字key+该关键字下的触发器对象
向触发组中添加触发器对象时，会按照level从大到小排序触发器对象
触发组是一次触发过程的最小单位，一次触发会使得某个触发组中的所有触发器对象依次触发

{
    key:TriggerItem[]
}

### 触发器对象

TriggerItem/触发器对象是触发器的最小单位，触发器对象是自动产生的
{
    uuId:string,//创建该触发器对象时分配的随机ID,
    source:Object,//创建该触发器的来源,
    callback:()=>void,//触发器的回调函数，可以理解为触发器触发时产生的效果，
    level?:number,//触发器的优先级，默认为0，优先级越高越先触发
}

### when/how/key/callback

when: 过程事件发生的过程分为2个部分：before 和 after，会分别在过程事件的函数触发前/后调用对应的触发器

how：触发器所挂载的对象在这个事件中是一个什么样的角色：
    make（产生事件）via（参与事件/事件媒介）make（被事件作用）

key：触发关键词是你希望触发这个触发器的过程事件的key，例如"damage"(造成伤害),"heal"(造成回复)

callback：触发回调函数：(event:ActionEvent)=>void
    触发器都是由一个过程事件所触发的(效果触发的触发器也是因一个事件而产生的)
    因此会且仅会为所有的触发回调函数提供触发该触发器的过程事件，以及可能的效果

### 总结示例 

我希望在玩家回复生命(heal)时触发如下效果：使得这次回复生命额外回复2点生命
=>
那么我就需要在玩家【回复生命时】触发我的触发器，即触发器的触发关键词为heal(我需要知道这个事件的key！具体可以参见ActionEvent)
我希望在回复生命事件的效果产生之前，修改这个效果，那么触发器应该是过程事件之前触发，即触发器的触发时机为before
玩家回复生命时，回复生命效果事件作用于玩家，玩家承受效果事件，即触发器的触发机制为take

总结为伪代码：before Player take heal
这个触发器应当被挂载到玩家上，则最终的伪代码是：

Player.[before take heal => 执行触发器效果，获取生命回复事件，使其数值+2]

## 过程

### 创建+挂载触发器

通常情况下，创建一个触发器需要提供如下内容

{
    source:Object,//创建触发器的来源
    when:"before"|"after", //触发时机
    how:"take"|"make"|"via", //触发方式
    key:string, //触发关键词
    callback:()=>void, //触发器内容
    level?:number //触发优先级，默认为0级，优先级越大越先触发
}

也支持以更简洁的形式创建触发器

source,[when,how,key,callback,level] 
例如:createTrigger(player,[before,take,damage,()=>{……},100])

创建+挂载触发器有一个返回值:
{
    remover:()=>void,//卸载该触发器的回调函数,
    __key:string,//该触发器的唯一标识key
}

### 触发触发器

通常情况下，在某个过程事件发生时，某个参与其中的对象会在对应的时刻以对应的形式获得对应事件对应的所有触发器Item

eg:发生了如下事件 

{
    source:敌人A,
    medium:动作B,
    target:玩家player,
    key:"damage",
    info:{}
}

这个一个敌人A通过动作B对玩家造成伤害的事件，在其执行的过程中，会有如下步骤

对S,M,T分别触发before:make,via,take
=>
执行事件本身的效果
=>
对S,M,T分别触发after:make,via,take

每次触发都会为触发器提供

### 卸载触发器

有3种方式卸载触发器

1.提供触发器的唯一标识__key：从对象身上卸载这1个触发器
2.提供触发器的来源source: 从对象身上卸载这个来源所挂载的【所有触发器】
3.调用卸载回调函数：从对象身上卸载对应的触发器

<!-- ### 阻止触发器

通过添加和卸载【触发拦截器】来阻止对象上的某一类触发器的【所有回调】触发
触发拦截器支持传入拦截对象的key或者触发链的key数组

注意：需要与【阻止事件】做出区别，后者针对的某个key的具体事件，而非一系列的回调事件

例如：
1.我想阻止玩家下一个回合开始时，回复能量时的触发器=>拦截["turnStart" => "energyRecover"]
2.我想阻止敌人回复生命时的任意效果=>拦截"heal"

通过上文可知，触发器是由触发器对象构成的
触发拦截器会拦截触发器的所有触发器对象，并提供如下回调

-条件触发：blockCondition(triggerItem,actionEvent)=>bool 
仅在返回true时拦截该触发器对象，不会调用其回调函数，默认返回true -->


# 默认触发器

一部分实体会携带默认的触发器，有些是在实体数据内定义的，有些则是为某一类实体供应的

例如卡牌对象，其会在创建时默认地获得一个“after via useCard => 丢弃到弃牌堆”的触发器

这些默认触发器的id和卸载方法会被记录在触发器的挂载对象的非可见属性_defaultTrigger中，同时我们建议给这些默认触发器一个描述值，以便操作者知晓这些触发器的作用

_defaultTrigger:[
    {
        triggerWay:"when_how_key",//例如 after_via_useCard
        id:string,
        remove:()=>void,
        info:string
    }
]

我们只推荐您移除那些您知道的触发器，所以triggerWay是一个有必要的筛选条件

## 关键触发器

有一些触发器可能与对象身上当前的某些触发器相互冲突，对于这类触发器，我们强烈建议您在挂载时将其添加到非可见属性_importantTrigger中

关键触发器属性是一个快捷查询方法，以便您在尝试删除某个与您想要添加的触发器相互冲突的旧触发器时快速获取目标，其结构与默认触发器的单元结构是相同的，但要多加一个importantKey和一个可能的onlyKey

{
    importantKey:string,
    onlyKey?:string
    triggerWay:"when_how_key",//例如 after_via_useCard
    id:string,
    remove:()=>void,
    info:string
}

importantKey可以理解为是对这个触发器的更精确的描述，我们强烈建议您使用这个键来尝试获取期望的触发器

onlyKey则更进一步，其在关键触发器中是唯一的，其对应地限制了某些不可重复的触发器操作
例如我们上面举例的的“使用完卡牌后，丢弃到弃牌堆”，如果为这种卡牌添加【消耗】词条，那么【消耗】词条将会为卡牌添加“使用完卡牌后，移动到消耗堆”的触发器
很明显前后两个触发器的相互冲突的，这种时候就需要将
1.将“丢弃到弃牌堆”的触发器记录到关键触发器中，为其添加onlyKey:"afterUseCard"
2.在【消耗】词条的效果中，将添加“移动到消耗堆”的触发器，修改为替代关键触发器onlyKey = "afterUseCard"

相关的函数为
card._importantTrigger.swapOnlyTrigger()

这个方法会1.移除旧的触发器，2.在同样的位置添加新的触发器，3.修改关键触发器的信息