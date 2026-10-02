// shared/roles.ts
// 角色相关代码：角色定义、角色列表、图标路径工具
// 注意：localStorage 持久化属于浏览器行为，在前端 settingsStore 中处理，
// 本文件需保持服务端可用，不引用任何 window/document/localStorage。

/** 触发组：时机中存在多个条件时需同时满足 */
export interface RoleTrigger {
  /** 触发时机 */
  timing: string;
  /** 效果文本，[*n] 表示持续 n 回合 */
  effect: string;
}

/** 角色技能：触发型（triggers）与/或固有属性（passives） */
export interface RoleSkill {
  /** 技能名 */
  name: string;
  /** 技能图标（emoji） */
  emoji: string;
  /** 触发组（1 个或多个） */
  triggers: RoleTrigger[];
  /** 固有属性（无时机效果，始终生效） */
  passives?: string[];
}

export interface RoleDef {
  /** 角色唯一 id，同时对应前端 assets/roles/{id}.png 图标文件 */
  id: number;
  /** 角色显示名 */
  name: string;
  /** 角色图标 emoji（列表/按钮上配合名称显示） */
  emoji: string;
  /** 定位标签 */
  tags: string[];
  /** 核心机制（可多个） */
  mechanics: string[];
  /** 技能列表 */
  skills: RoleSkill[];
}

/**
 * 角色列表
 * 新增角色时追加即可，id 与 assets/roles/ 下的 png 文件名对应。
 */
export const ROLES: RoleDef[] = [
  {
    id: 1,
    name: '僵尸',
    emoji: '🧟',
    tags: ['输出', '凋零'],
    mechanics: ['血量'],
    skills: [
      { name: '增援', emoji: '💪', triggers: [{ timing: '回合开始时，血量≤12', effect: '获得1层力量[*1]' }] },
      { name: '异变', emoji: '🧬', triggers: [{ timing: '回合开始时，血量为奇数', effect: '获得1层抗性[*1]' }] },
      { name: '亡灵', emoji: '☠️', triggers: [{ timing: '回合开始时', effect: '获得1层凋零' }] },
    ],
  },
  {
    id: 2,
    name: '潜影贝',
    emoji: '🐚',
    tags: ['回血', '护盾'],
    mechanics: ['护盾', '凋零'],
    skills: [
      { name: '防御', emoji: '🛡️', triggers: [{ timing: '凋零被清除时', effect: '获得1层护盾' }] },
      { name: '隐匿', emoji: '🫥', triggers: [{ timing: '拥有护盾时，回血时', effect: '此次回血量+1' }] },
      { name: '禁锢', emoji: '🔒', triggers: [], passives: ['血量上限最高为20', '卡牌上限-1'] },
    ],
  },
  {
    id: 3,
    name: '女巫',
    emoji: '🧙',
    tags: ['状态', '运营'],
    mechanics: ['状态'],
    skills: [
      { name: '酿造', emoji: '⚗️', triggers: [{ timing: '游戏开始时', effect: '获得1张红石粉' }] },
      { name: '诅咒', emoji: '🧿', triggers: [{ timing: '回合开始时，状态数＜4', effect: '获得1层虚弱[*1]' }] },
      { name: '药理', emoji: '💊', triggers: [{ timing: '回合开始时，状态数≥8', effect: '获得1层力量[*1]' }] },
    ],
  },
  {
    id: 4,
    name: '村民',
    emoji: '🧑‍🌾',
    tags: ['过牌', '护盾'],
    mechanics: ['丢弃'],
    skills: [
      { name: '交易', emoji: '🤝', triggers: [{ timing: '丢弃卡牌时，有剩余出牌次数时（仅出牌阶段）', effect: '消耗1次出牌次数，摸1张牌，获得1层护盾' }] },
      { name: '自私', emoji: '😈', triggers: [{ timing: '爆牌时', effect: '每爆1张牌受到2点魔法伤害' }] },
    ],
  },
  {
    id: 5,
    name: '悦灵',
    emoji: '🧚',
    tags: ['回血', '过牌'],
    mechanics: ['血量上限'],
    skills: [
      { name: '回收', emoji: '♻️', triggers: [{ timing: '对方丢弃卡牌时，本回合未触发此技能', effect: '获得该卡牌' }] },
      { name: '自愈', emoji: '💚', triggers: [{ timing: '回合开始时', effect: '回1点血' }] },
      {
        name: '精灵',
        emoji: '✨',
        triggers: [
          { timing: '生命上限即将减少时', effect: '抵消此次减少，然后失去随机1张手牌' },
          { timing: '生命上限即将增加时', effect: '抵消此次增加，然后摸1张牌' },
        ],
        passives: ['血量上限初始为15'],
      },
    ],
  },
  {
    id: 6,
    name: '恼鬼',
    emoji: '👹',
    tags: ['输出', '前期'],
    mechanics: ['丢弃'],
    skills: [
      { name: '突袭', emoji: '⚔️', triggers: [{ timing: '丢弃卡牌时，有剩余出牌次数时，没有魔咒爆发时', effect: '消耗1次出牌次数，使该牌对选择的目标生效' }] },
      { name: '狂暴', emoji: '🧨', triggers: [{ timing: '游戏开始时', effect: '获得1张烟花' }] },
      { name: '凋亡', emoji: '🥀', triggers: [{ timing: '回合开始时', effect: '生命上限-2' }] },
    ],
  },
];

/** 默认角色：僵尸 */
export const DEFAULT_ROLE_ID: number = ROLES[0].id;

/** 角色图标路径（低像素 png，前端渲染时使用 image-rendering: pixelated 保持像素清晰） */
export function getRoleIconPath(id: number): string {
  return `/assets/roles/${id}.png`;
}

/** 按 id 取角色定义，找不到（如 localStorage 脏数据）时回退默认角色 */
export function getRoleById(id: number): RoleDef {
  return ROLES.find(r => r.id === id) ?? ROLES[0];
}
