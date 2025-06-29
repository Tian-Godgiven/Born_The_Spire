[toc]

# 触发器 Trigger

触发器是绑定在实体Entity上的，会对过程事件ActionEvent进行相应的回调函数对象。

在某个过程事件发生的过程中，会对参与该过程事件的来源Source，媒介Medium，目标Target触发与该过程事件的key相同的触发器，并调用包含的回调函数

## 结构

触发器通过【触发时机】和【触发机制】分类

~~~
before:{
	make:{
        sourceKey:创建触发器的来源的标识key
        __key:触发器本身的标识key，是一个随机值
        callback:触发时调用的回调函数
        level:优先级，相同优先级的触发器会按添加触发器的顺序依次触发，优先级越高越先触发
    }[],
    on:同上,
    take:同上,
}
after:同上
~~~

### 触发时机 when

过程事件发生的过程分为2个部分：before 和 after，会分别在过程事件的对应的函数触发前/后调用对应的触发器

### 触发机制 how

参与过程事件的对象包含来源，媒介和目标，在触发对应的触发器时，会分别调用其 make，on，take类型的触发器，对应为“产生事件”，“参与事件”，“被事件作用”