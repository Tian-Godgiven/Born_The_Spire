# Born_The_Spire 蘇生尖塔

一款基于纯js(ts)的《杀戮尖塔》同人游戏，以定制化牌组和能力为主要特色。

灵感来源：https://www.nmbxd.com/t/62510110

**注意：**本项目***没有***获得原作者授权！如果您的本团的原作者并看到这里，请务必与我们取得联系！

框架：tauri2 + vue3  
语言：h5 + sass + ts  
平台：windows  
类型：PC端应用程序  

主要特色  
1.使用简洁的文字与线条还原《杀戮尖塔》原作的界面，充满独特的美感！  
2.将原作的角色与抽卡即相关的游戏内容替换为：以“器官”为游戏性载体，通过控制角色持有的“器官”来改变牌库与角色性能！  
3.开放的接口与mod支持，使用简明易懂的js语法，提供面向所有mod内容开发者的框架！  
4.免费开源（GPL3.0协议），且不会以此进行任何形式的商业or盈利行为！

前排提示：本项目预计将在**2025年1月**正式开启

---

# 游戏内容

企划还在慢慢写！这里先列一下我们打算做的内容！

## 1.界面

1.1.战斗界面：照搬原作！两侧是己方和敌方，都会显示各自拥有的器官（查看敌方的器官需要敌方使用or自身拥有相关能力），顶部是药水+遗物，底部是尽可能还原原作手感的卡牌界面

1.2.爬塔界面：不打算用原作的地图形式，生成起来比较麻烦！打算直接拿事件选择界面，每次爬塔时按规则生成3个选项的形式，如果具备某些遗物或器官，可以预见相应路线之后的选择（会固定出现这些选择）

1.3.事件界面：要做得比较开放！但总体还是以选项和按钮为主，可以支持响应出现一些小游戏界面！

1.4.其他界面：例如卡牌详情/卡库/弃牌堆，暂时还没有特殊的安排，就按照原作来！

## 2.对象

2.1.角色：和原作跑团一样的不可名状之物，可以使用多个器官，并因此获得相应的卡牌和性能，会对器官的重量，部位，数量做一定限制。目前不打算做器官之间的排异反应，也不打算做角色差分！

2.2.器官：主要的游戏性来源，可以通过事件/战斗/效果获得，获得时需要选择吞噬（+钱）和同化（装备器官）。器官本身具有重量，部位，等级，稀有度，质量等固有属性，可以在篝火（水塘）/事件/效果中升级器官。击败敌人时会从其拥有的器官中抽取获得。
角色的质量（生命值）由器官质量+基础质量构成，器官在战斗中可能承受伤害，器官死亡（质量=0）时，其提供的卡牌和性能会被暂时移除，直到修复该器官
装备器官会为角色带来卡牌和性能，一部分器官的性能的发挥可能存在一定的需求，此外一部分器官还可以在战斗/事件中主动使用。

2.3.卡牌：战斗中的行动，每回合弃牌+抽牌+获得能量点数的标准起手式，卡牌需要消耗相应的能量才能打出，并产生一定的效果。卡牌的获取渠道为器官/事件/效果。与原作一样，也会有惩罚性的卡牌出现。我们希望能尽可能地还原原作的打牌手感

2.4.敌人：敌人与角色一样拥有预制化的器官，并且器官的性能不会变化，敌人的行动不需要从器官提供的牌库抽卡，而是按照规则使用不同的器官提供的卡牌，这个过程中可能包含一定的随机性。可以大致理解为原作的敌人行动方式，但是在某个行动时可能会出现一定的随机性变化（例如某个器官提供3张卡牌，可能随机使用其中一张），与此同时由于敌人可能拥有多个器官，因此其一次行动会像玩家一样出多张卡牌

2.5.战斗：战斗为回合制进行，基本与原作一致。角色每回合根据性能获得能量，抽取卡牌，打出卡牌，丢弃卡牌。敌人每回合使用器官能力。随后又轮到玩家回合。直到双方一方的质量归0。与此同时使用各遗物/效果/被动/等等能力

2.6.药水：一种能在任意时刻使用的道具，提供不同的能力，类比原作就行！不过我们这边在考虑减少药水的获取途径，转而提供一些能够生成药水的器官，走药水流？不过做是肯定要做的！

2.7.遗物：原作的游戏性的重大来源，我们自然也不会落下，同样是定位为全局产生各种效果的道具，也会加入使用功能！可能会在之后考虑进行一些设定/游戏性方面的改动？

2.8.货币与商店：货币的来源为战斗胜利的奖励/分解不需要的器官，在爬塔过程中随机出现的商店里购买器官/遗物！删牌可能会和分解器官的功能冲突，目前还没有想到比较好的解决方案(

2.9.事件：爬塔过程中随机出现的？房，以选项为主，获得不同的奖励，不会出现纯粹的惩罚事件！事件能够提供包括但不限于器官/药水/卡牌/角色性能/货币/回血等奖励。

## 3.接口开放

以上内容都是我们预计实现的框架，但这类游戏的重头在于内容堆砌和数值平衡

想要还原原作的数值平衡完全不可能，但堆量的话我们可以借助游戏社区的帮助（求求了

我们预计会开放以下内容的接口以供mod制作者使用，并承诺会推出相应的使用文档
1.器官，卡牌，药水，事件，遗物，敌人，货币的全部接口
2.商店的部分接口，主要是商店内可以进行的操作
3.战斗界面与爬塔界面的部分，主要是新增一些显示性的内容（比如鸡煲的球框框，红蓝紫观者），以及修改一些内容的显示（比如某个效果的文本颜色/字体，效果详情的内容）
4.事件界面的绝大部分接口，除了事件界面本身以外都会提供用以定制。
5.角色的部分接口，主要开放角色性能方面的接口

与此同时，我们还打算做类似node_modules的包管理系统，用以辅助用户管理和使用mod

另外，在框架的搭建结束，来到测试阶段时，我们会根据反响，考虑制作一个简单的mod制作辅助工具，提供一些预制化的选项，来帮助没有编程经验的朋友循序渐进地接触mod的制作！
