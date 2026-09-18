import type { ChangelogEntry } from '../types'

export const changelog011: ChangelogEntry = {
    version: '0.1.1',
    systems: [
        '新增召唤物（Companion）体系 => 可配置友方行动、临时召唤与战斗结束消灭；玩家可通过【分体囊】召唤【你（小）】，蚁后战斗也已基于此重做。'
    ],
    fixes: [
        { summary: '卡牌上写的伤害数字与实际造成的伤害不一样 => 修复伤害预览系统。', contributor: 'HvGSHA4、WG0T6zv' },
        { summary: '限时无敌版 => 程序问题已修复。', contributor: 'nR7pHXF' },
        { summary: '手机上很难玩 => 已完成一轮移动端适配，仍需后续跟进。', contributor: 'KC0CZPV' },
        { summary: '多重存在了 => 状态管理问题已修复，暂未再现。', contributor: 'V3DJcNq' },
        { summary: '投骰子事件缺少中途退出按钮 => 移动端界面已一定程度修复，仍需后续跟进。', contributor: 'b5YqZVn' },
        { summary: 'Boss 炙渣王全程挂机叠甲 => 修复 Boss 意图逻辑。', contributor: 'WG0T6zv' },
        { summary: '打完 Boss 后卡住 => 新增「未完待续」提示页，并支持「再来一发」。', contributor: 'WG0T6zv' },
        { summary: '小兽伙伴想要奖励但无法给予 => 优化了小兽伙伴的交互。', contributor: 'WG0T6zv' },
        { summary: '右上角地图、卡组、遗物间距不清晰 => 优化过时的按钮。', contributor: 'WG0T6zv' },
        { summary: '很多能点的内容看着像文字 => 优化过时的按钮。', contributor: 'ROqUv7E' },
        { summary: '开局三连 23 的重锤过强 => 削弱重锤伤害。', contributor: 'XSMsWgO' },
        { summary: '双毒小怪扣血过高 => 削弱双毒怪的行为逻辑。', contributor: 'XSMsWgO' },
        { summary: '会员卡意义不明 => 修复会员卡，获得后会立即使当前黑市商品打折。', contributor: 'XSMsWgO' },
        { summary: '右上角返回容易误点 => 「回到标题页」已收纳至选项菜单。', contributor: 'XSMsWgO' },
        { summary: '毒皮过于超模 => 削弱毒蟾蜍上毒速率，毒皮改为蟾蜍皮。', contributor: 'XSMsWgO' },
        { summary: '寄生种子遗物扣血太狠 => 改为可被护甲格挡的攻击伤害。', contributor: 'XSMsWgO' },
        { summary: '【深呼吸】打完不抽牌 => 已修复。', contributor: 'XSMsWgO' },
        { summary: '骰子事件奖惩失衡 => 强化奖惩，移除过于抠门的小奖励。', contributor: 'XSMsWgO' },
        { summary: 'Boss 房死亡后器官提供的卡牌丢失 => 已修复。', contributor: 'XSMsWgO' },
        { summary: '包子爆发无效 => 已修复。', contributor: 'yXENcor' },
        { summary: '移动端重打会改卡组 => 程序问题已修复。', contributor: 'yXENcor' },
        { summary: '被动护甲数值太高，且不同级别可叠加 => 将在后续继续调整。', contributor: 'XSMsWgO' },
        { summary: '移动端有时无法把卡牌拖至敌人身上 => 问题较复杂，将后续调整。', contributor: 'yXENcor' },
        { summary: '取消器官选择后仍显示已选中 => 暂未能复现。', contributor: 'yXENcor' },
        { summary: '移动端 Boss 血条与状态栏不易操作 => 已进行相应调整，仍需后续跟进。', contributor: 'yXENcor' },
        { summary: '移动端虚无的【孢子】会进弃牌堆 => 已修复。', contributor: 'yXENcor' },
        { summary: '【随机打击】击杀敌人后生命变为 NaN => 该测试卡牌及部分过时旧代码已移除。', contributor: 'yXENcor' },
        { summary: '废铁战甲第二回合会卡住 => 修复 Boss 意图逻辑。', contributor: 'yXENcor、XSMsWgO' },
        { summary: '【火力覆盖】打出后无效 => 修复过时旧代码并调整卡牌效果。', contributor: 'yXENcor' },
        { summary: '【结茧】给了 0 费【孢子】 => 修复卡牌池问题。', contributor: 'XSMsWgO' }
    ],
    roadmap: {
        next: [
            '平衡护甲与乌龟流。',
            '完善存档系统与 0.5 SL。',
            '继续丰富第一层，或开始制作第二层。'
        ],
        later: [
            '局内统计。',
            '联机（可行性存疑）。',
            '可视化编辑器。',
            '创意工坊。'
        ]
    }
}
