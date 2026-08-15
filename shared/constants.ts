import { CostType, BuffType, EffectDef, CardDef, ActiveBuff } from './types';

// ===== 游戏常量 =====
export const DEFAULT_MAX_HP = 20;
export const DEFAULT_HAND_LIMIT = 10;
export const INITIAL_DRAW_COUNT = 3;
export const TURN_DRAW_COUNT = 3;
export const MAX_STRATEGY_PER_TURN = 3;

// ===== 卡牌类型图标映射 (icon列的最后一位数字 → CostType) =====
const TYPE_MAP: Record<number, CostType> = {
  1: CostType.Action,
  2: CostType.Strategy,
  3: CostType.Heal,
  4: CostType.Attack,
  5: CostType.Buff,
  6: CostType.Debuff,
  7: CostType.Event,
  8: CostType.Equip,
  9: CostType.Weapon,
  10: CostType.Field,
  11: CostType.Counter,
};

// 消耗类型（有使用限制的类别）：行动/锦囊/装备/武器/场地 → 解析时稳定前置
const RESOURCE_TYPE_NUMS = new Set([1, 2, 8, 9, 10]);

// 解析 icon 列：每个数字都对应一个卡牌类型（前/中间数字为效果类型，最后一位为消耗类型）
// 排序规则：消耗类型（1/2/8/9/10）稳定前置，其余按 icon 原始顺序排后；组内保持原顺序
export function parseIcon(iconStr: string): CostType[] {
  const nums = iconStr.split(',').map(Number).filter(n => TYPE_MAP[n] !== undefined);
  nums.sort((a, b) => Number(RESOURCE_TYPE_NUMS.has(b)) - Number(RESOURCE_TYPE_NUMS.has(a)));
  return nums.map(n => TYPE_MAP[n]);
}

// 便捷创建 EffectDef
function eff(buffType: BuffType, value: number, duration?: number): EffectDef {
  return { buffType, value, duration, target: 'self' };
}

// 便捷创建 ActiveBuff
function activeBuff(buffType: BuffType, stacks: number, remainingTurns?: number): ActiveBuff {
  const value = stacks;
  return { buffType, value, stacks, remainingTurns, sourceCardId: '', sourcePlayerId: '' };
}

// ===== 卡牌定义 =====
interface CardTemplate {
  id: string;
  name: string;
  icon: string;
  costType: CostType;
  effects: EffectDef[];
  buffs: ActiveBuff[];
  description: string;
  weight: number;
  defaultTarget: 'self' | 'opponent' | 'all';
}

// ID 与 assets/item/{id}.png/.gif 对应
export const CARDS: CardTemplate[] = [
  {
    id: 'card_1', name: '苹果', icon: '3,1', weight: 10, defaultTarget: 'self',
    costType: CostType.Action,
    effects: [eff(BuffType.Heal, 3)],
    buffs: [],
    description: '回3点血',
  },
  {
    id: 'card_2', name: '烟花', icon: '4,1', weight: 20, defaultTarget: 'opponent',
    costType: CostType.Action,
    effects: [eff(BuffType.PhysicalDamage, 5)],
    buffs: [],
    description: '5点物理伤害',
  },
  {
    id: 'card_3', name: '龙息', icon: '4,1', weight: 6, defaultTarget: 'opponent',
    costType: CostType.Action,
    effects: [
      eff(BuffType.Damage, 3, 2)
    ],
    buffs: [activeBuff(BuffType.Damage, 3, 2)],
    description: '3点魔法伤害[*2]',
  },
  {
    id: 'card_4', name: '金苹果', icon: '3,1', weight: 6, defaultTarget: 'self',
    costType: CostType.Action,
    effects: [
      eff(BuffType.Heal, 2, 2)  // 每回合回2血，持续2回合
    ],
    buffs: [activeBuff(BuffType.Heal, 2, 2)],
    description: '回2点血[*2]',
  },
  {
    id: 'card_5', name: '火把', icon: '5,2', weight: 5, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.Strength, 1, 2),
      eff(BuffType.RemoveWither, 3),
    ],
    buffs: [activeBuff(BuffType.Strength, 1, 2)],
    description: '力量+1层[*2] / 移除3层凋零',
  },
  {
    id: 'card_6', name: '灯笼', icon: '5,2', weight: 5, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.Resistance, 1, 2),
      eff(BuffType.FireResist, 1, 2),
      eff(BuffType.Shield, 1),
    ],
    buffs: [
      activeBuff(BuffType.Resistance, 1, 2),
      activeBuff(BuffType.FireResist, 1, 2),
      activeBuff(BuffType.Shield, 1),
    ],
    description: '抗性+1层[*2] /抗火+1层[*2] / 护盾+1层',
  },
  {
    id: 'card_7', name: '奶桶', icon: '7,2', weight: 2, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [eff(BuffType.ReduceDuration, 1)],
    buffs: [],
    description: '目标所有限时型状态持续时间-1回合',
  },
  {
    id: 'card_8', name: '灵魂火把', icon: '6,2', weight: 5, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.Weakness, 2, 2),
      eff(BuffType.ReduceMaxHp, 2),
    ],
    buffs: [
      activeBuff(BuffType.Weakness, 2, 2),
    ],
    description: '虚弱+2层[*2] / 生命上限-2点',
  },
  {
    id: 'card_9', name: '灵魂灯笼', icon: '6,2', weight: 5, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.Vulnerability, 1, 2),
      eff(BuffType.Wither, 2),
    ],
    buffs: [
      activeBuff(BuffType.Vulnerability, 1, 2),
      activeBuff(BuffType.Wither, 2),
    ],
    description: '易伤+1层[*2] / 增加2层凋零',
  },
  {
    id: 'card_10', name: '刷怪笼', icon: '4,1', weight: 4, defaultTarget: 'opponent',
    costType: CostType.Action,
    effects: [eff(BuffType.ConditionalDiscard, 4)],
    buffs: [],
    description: '使目标立即丢弃一张<烟花>或<龙息>，否则获得2回合「尸潮」',
  },

  {
    id: 'card_11', name: '仙人掌', icon: '7,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],
    description: '对所有人造成1点物理伤害 / 丢弃此牌时摸1张牌',
  },
  {
    id: 'card_12', name: '发光浆果', icon: '5,2', weight: 4, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.HealBoost, 1, 2),
      eff(BuffType.IncreaseMaxHp, 2),
    ],
    buffs: [
      activeBuff(BuffType.HealBoost, 1, 2),
    ],
    description: '治愈增强+1层[*2] / 生命上限+2点',
  },
  {
    id: 'card_13', name: '蜘蛛网', icon: '6,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [
      activeBuff(BuffType.LockAction, 1, 1),
      activeBuff(BuffType.LockStrategy, 1, 1),
    ],
    description: '目标获得「行动封锁」[*1]或「锦囊封锁」[*1](自选)',
  },
  {
    id: 'card_14', name: '枯萎的灌木', icon: '6,2', weight: 3, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.FireVuln, 2, 2),  // 火焰伤害+2，持续2回合
      eff(BuffType.Blight, 1, 2),    // 回血少回1点，持续2回合
    ],
    buffs: [
      activeBuff(BuffType.FireVuln, 2, 2),
      activeBuff(BuffType.Blight, 1, 2),
    ],
    description: '易燃+2层[*2]（受火焰伤害+2） / 枯萎+1层[*2]（回血时少回1点）',
  },
  {
    id: 'card_15', name: '合金碎片', icon: '5,2', weight: 3, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [eff(BuffType.Block, 5, 2)],
    buffs: [activeBuff(BuffType.Block, 5, 2)],
    description: '目标获得「格挡」[*2]（抵消5点物理伤害，一次性）',
  },
  {
    id: 'card_16', name: '望远镜', icon: '7,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [eff(BuffType.RevealHand, 10)],
    buffs: [],
    description: '目标展示所有手牌给出牌者',
  },
  {
    id: 'card_17', name: '萝卜钓竿', icon: '7,2', weight: 5, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [eff(BuffType.StealCard, 1)],
    buffs: [],
    description: '抽取目标一张手牌并获得',
  },
  {
    id: 'card_18', name: '诡异钓竿', icon: '7,2', weight: 4, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],  // 效果在弹窗中处理
    description: '选择目标一张装备并使其丢弃',
  },
  {
    id: 'card_19', name: '蛋糕', icon: '3,1', weight: 4, defaultTarget: 'self',
    costType: CostType.Action,
    effects: [
      eff(BuffType.HealAll, 1),
      eff(BuffType.HealAll, 1),
      eff(BuffType.Heal, 2)
    ],
    buffs: [],
    description: '所有人回2次1点血 / 我方额外回1次2点血',
  },
  {
    id: 'card_20', name: '潜影盒', icon: '7,2', weight: 3, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [
      eff(BuffType.DrawCard, 3),
      eff(BuffType.Vulnerability, 1, 1),
    ],
    buffs: [
      activeBuff(BuffType.Vulnerability, 1, 1),
    ],
    description: '摸3张牌 / 易伤+1[*1]',
  },

  {
    id: 'card_21', name: '绑定诅咒', icon: '6,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [eff(BuffType.DamageOnDiscard, 3, 2)],
    buffs: [activeBuff(BuffType.DamageOnDiscard, 3, 2)],
    description: '目标获得「绑定诅咒」[*2]（丢弃牌时对其造成3点伤害，每回合1次）',
  },
  {
    id: 'card_22', name: '迷之炖菜', icon: '3,1', weight: 2, defaultTarget: 'self',
    costType: CostType.Action,
    effects: [eff(BuffType.HealPerBuff, 1)],
    buffs: [],
    description: '我方每存在一个状态目标回1点血',
  },
  {
    id: 'card_23', name: '钻石胸甲', icon: '8', weight: 1, defaultTarget: 'self',
    costType: CostType.Equip,
    effects: [eff(BuffType.Resistance, 1, 1)],
    buffs: [activeBuff(BuffType.Resistance, 1, 1)],
    description: '抗性+1层[*1] / 获得护盾时改为回对应点血',
  },
  {
    id: 'card_24', name: '金护腿', icon: '8', weight: 1, defaultTarget: 'self',
    costType: CostType.Equip,
    effects: [],
    buffs: [activeBuff(BuffType.Shield, 1)],
    description: '每回血抵消1点凋零获得1点护盾',
  },
  {
    id: 'card_25', name: '皮革鞋子', icon: '8', weight: 1, defaultTarget: 'self',
    costType: CostType.Equip,
    effects: [],
    buffs: [],
    description: '装备目标回合摸牌量+1',
  },
  {
    id: 'card_26', name: '海龟壳', icon: '8', weight: 1, defaultTarget: 'self',
    costType: CostType.Equip,
    effects: [eff(BuffType.FireResist, 1, 1)],
    buffs: [activeBuff(BuffType.FireResist, 1, 1)],
    description: '免疫蜘蛛网 / 抗火[*1]',
  },
  {
    id: 'card_27', name: '三叉戟', icon: '9', weight: 1, defaultTarget: 'self',
    costType: CostType.Weapon,
    effects: [eff(BuffType.Strength, 1, 1)],
    buffs: [activeBuff(BuffType.Strength, 1, 1)],
    description: '力量+1层[*1] / 对处于凋零状态下的目标造成物理伤害时；本次伤害+1点',
  },
  {
    id: 'card_28', name: '烈焰棒', icon: '9', weight: 1, defaultTarget: 'self',
    costType: CostType.Weapon,
    effects: [],
    buffs: [],
    description: '造成物理伤害后丢弃一张牌可额外造成1次2点火焰伤害',
  },
  {
    id: 'card_29', name: '玻璃板', icon: '7,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],
    description: '使我方本回合上次打出的牌的打出效果再次触发，作为行动牌打出时需额外消耗2次出牌次数',
  },
  {
    id: 'card_30', name: '酿造台', icon: '9', weight: 1, defaultTarget: 'self',
    costType: CostType.Weapon,
    effects: [],
    buffs: [],
    description: '装备时可将<苹果>和<烟花>互相转化，可将<龙息>和<金苹果>互相转化',
  },

  {
    id: 'card_31', name: '蜘蛛眼', icon: '6,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [eff(BuffType.Poison, 2, 2)],
    buffs: [
      activeBuff(BuffType.Poison, 2, 2)
    ],
    description: '目标获得「中毒」[*2]（回血后受到2点魔法伤害）',
  },
  {
    id: 'card_32', name: '侦测器', icon: '5,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],  // 展示随机1张手牌
    description: '猜测对方随机一张手牌的权重，猜中则我方获得「暴击」（下一次物理伤害×1.5，不可叠加）',
  },
  {
    id: 'card_33', name: '下界荒地', icon: '10', weight: 1, defaultTarget: 'self',
    costType: CostType.Field,
    effects: [],
    buffs: [
      activeBuff(BuffType.Shield, 1)
    ],
    description: '丢弃牌时获得1点护盾',
  },
  {
    id: 'card_34', name: '冰原', icon: '10', weight: 1, defaultTarget: 'self',
    costType: CostType.Field,
    effects: [],
    buffs: [],
    description: '回血类和攻击类消耗次数互通',
  },
  {
    id: 'card_35', name: '陷阱箱', icon: '6,2', weight: 2, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [eff(BuffType.WitherOnDraw, 1, 1)],
    buffs: [
      activeBuff(BuffType.WitherOnDraw, 1, 1)
    ],  // 摸牌得凋零，持续2回合
    description: '目标获得「陷阱」[*2]（每获得1张牌+1层凋零）',
  },
  {
    id: 'card_36', name: '丛林', icon: '10', weight: 1, defaultTarget: 'self',
    costType: CostType.Field,
    effects: [],
    buffs: [],
    description: '回血时额外回复1次1点血(每回合限1次) / 我方凋零清空时；生命上限+1',
  },
  {
    id: 'card_37', name: '附魔台', icon: '7,11', weight: 2, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [eff(BuffType.EnchantBurst, 1, 2)],
    buffs: [
      activeBuff(BuffType.EnchantBurst, 1, 2)
    ], // 获得1层魔咒爆发，持续2回合
    description: '获得1层「魔咒爆发」[*2]（丢弃牌能使其生效，获得当回合无法触发，一次性）',
  },
  {
    id: 'card_38', name: '村庄', icon: '10', weight: 1, defaultTarget: 'self',
    costType: CostType.Field,
    effects: [],
    buffs: [],
    description: '卡牌上限+4 / 免疫「尸潮」',
  },
  {
    id: 'card_39', name: '烈焰粉', icon: '7,2', weight: 5, defaultTarget: 'opponent',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],
    description: '本回合造成物理伤害后才能打出；造成3点火焰伤害（每回合限1次）',
  },
  {
    id: 'card_40', name: '滴水石锥', icon: '9', weight: 1, defaultTarget: 'self',
    costType: CostType.Weapon,
    effects: [],
    buffs: [],
    description: '造成物理伤害时回1点血',
  },
  {
    id: 'card_41', name: '运输矿车', icon: '7,2', weight: 3, defaultTarget: 'self',
    costType: CostType.Strategy,
    effects: [],
    buffs: [],  // 效果在引擎中处理（选牌弹窗）
    description: '从牌组抽4张牌展示，然后从自己开始轮流选择1张加入手牌',
  },
  {
    id: 'card_42', name: '幽匿尖啸体', icon: '9', weight: 1, defaultTarget: 'self',
    costType: CostType.Weapon,
    effects: [],
    buffs: [
      activeBuff(BuffType.Wither, 1)
    ],
    description: '造成物理伤害时所有人增加1点凋零，凋零被清空时对方随机丢弃一张手牌',
  },
  {
    id: 'card_43', name: '重生锚', icon: '4,1', weight: 1, defaultTarget: 'opponent',
    costType: CostType.Action,
    effects: [eff(BuffType.PhysicalDamage, 3)],
    buffs: [],
    description: '3点物理伤害 / 2点火焰伤害',
  },
  {
    id: 'card_44', name: '海洋之心', icon: '11,7', weight: 2, defaultTarget: 'self',
    costType: CostType.Counter,
    effects: [],
    buffs: [
      activeBuff(BuffType.Shield, 2)
    ],
    description: '受到火焰伤害时失去此牌并抵消此次伤害 / 丢弃此牌时：获得2层护盾',
  },
  {
    id: 'card_45', name: '盾牌', icon: '8', weight: 1, defaultTarget: 'self',
    costType: CostType.Equip,
    effects: [],
    buffs: [],
    description: '受到物理伤害时伤害者获得「行动封锁」[*1]和「锦囊封锁」[*1]和「丢弃诅咒」3层[*1]',
  },
];

// ===== 根据权重构建牌组 =====
export function buildTestDeck(): CardDef[] {
  const deck: CardDef[] = [];
  for (const template of CARDS) {
    for (let i = 0; i < template.weight; i++) {
      deck.push({
        id: `${template.id}_${i}`,
        name: template.name,
        icon: template.icon,
        costType: template.costType,
        effects: template.effects,
        buffs: template.buffs,
        description: template.description,
        weight: template.weight,
        defaultTarget: template.defaultTarget,
      });
    }
  }
  return deck;
}
