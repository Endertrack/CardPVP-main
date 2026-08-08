export declare enum CostType {
    Action = "action",// icon1 行动卡
    Strategy = "strategy",// icon2 锦囊卡
    Heal = "heal",// icon3 回血卡
    Attack = "attack",// icon4 攻击卡
    Buff = "buff",// icon5 增益卡
    Debuff = "debuff",// icon6 减益卡
    Event = "event",// icon7 事件卡
    Equip = "equip",// icon8 装备卡
    Weapon = "weapon",// icon9 武器卡
    Field = "field",// icon10 场地卡
    Counter = "counter"
}
export declare enum BuffType {
    Strength = "strength",// buff1 力量
    Weakness = "weakness",// buff2 虚弱
    Resistance = "resistance",// buff3 抗性
    Vulnerability = "vuln",// buff4 易伤
    Heal = "heal",// buff5 回血
    Wither = "wither",// buff6 凋零
    Shield = "shield",// buff7 护盾
    FireResist = "fireResist",// buff8 抗火
    Poison = "poison",// buff9 中毒
    FireVuln = "fireVuln",// buff10 火焰易伤（受到火焰伤害+n）
    HealBoost = "healBoost",// buff12 治愈增强
    LockAction = "lockAction",// buff13 行动封锁
    LockStrategy = "lockStrategy",// buff16 锦囊封锁
    WitherOnDraw = "witherOnDraw",// buff18 摸牌凋零（陷阱箱）
    DamageBoost = "damageBoost",// buff19 伤害加成（侦测器）
    RemoveWither = "removeWither",// 特殊：移除凋零
    ReduceDuration = "reduceDuration",// 特殊：减少限时状态回合
    ReduceMaxHp = "reduceMaxHp",// 特殊：降低生命上限
    IncreaseMaxHp = "increaseMaxHp",// 特殊：提升生命上限
    ConditionalDiscard = "conditionalDiscard",// 特殊：条件丢弃
    PhysicalDamage = "phydamage",// 物理伤害
    Damage = "damage",// 魔法伤害
    DrawCard = "drawCard",// 摸牌
    StealCard = "stealCard",// 抽取目标手牌
    RevealHand = "revealHand",// 展示目标手牌
    ForceDiscardEquip = "forceDiscardEquip",// 强制丢弃装备/武器/场地
    DamageOnDiscard = "damageOnDiscard",// 丢弃时受伤害
    HealPerBuff = "healPerBuff",// 每存在一种状态回1点血
    HealAll = "healAll",// 所有人回血
    Horde = "horde",// 尸潮
    Blight = "blight",// 枯萎
    Block = "block",// 格挡
    EnchantBurst = "enchantBurst"
}
export type TargetType = 'self' | 'opponent';
export interface EffectDef {
    buffType: BuffType;
    value: number;
    duration?: number;
    target: TargetType;
}
export interface CardDef {
    id: string;
    name: string;
    icon: string;
    costType: CostType;
    effects: EffectDef[];
    description: string;
    weight?: number;
    sourcePlayerId?: string;
    defaultTarget: 'self' | 'opponent' | 'all';
}
export interface ActiveBuff {
    buffType: BuffType;
    value: number;
    stacks: number;
    remainingTurns?: number;
    sourceCardId: string;
    sourcePlayerId?: string;
}
export interface PlayerState {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    deck: CardDef[];
    hand: CardDef[];
    discardPile: CardDef[];
    buffs: ActiveBuff[];
    equipment: {
        equip?: CardDef;
        weapon?: CardDef;
        field?: CardDef;
    };
    healCountThisTurn: number;
    attackCountThisTurn: number;
    actionStrategyCountThisTurn: number;
    handLimitBonus: number;
    actionLimitBonus: number;
    damageOnDiscardCount: number;
    lastPlayedCardDef: CardDef[];
    lastPlayedCardName: string;
    lastPlayedCardEffects: EffectDef[];
    lastPlayedCardCostType: CostType;
    causePhysicalDamage: boolean;
    enchantBurstReady: boolean;
    pendingGuessCardId: string;
    pendingGuessCardWeight: number;
    pendingGuessCardName?: string;
    playedCardTypesThisTurn: CostType[];
    draftCards: CardDef[];
    draftPlayerPick: number;
    draftPickCount: number;
    draftPickedBy: Record<number, string>;
    jungleHpUpTriggered: boolean;
    pendingBucketChoice: string;
    pendingEquipChoice: string;
    pendingEquipCard?: CardDef;
}
export declare enum GamePhase {
    Waiting = "waiting",
    Playing = "playing",
    GameOver = "gameOver"
}
export interface GameLogEntry {
    turnNumber: number;
    message: string;
    type?: 'endTurn' | 'warning' | 'error';
    timestamp: number;
}
export interface GameState {
    roomId: string;
    players: [PlayerState, PlayerState];
    currentTurnIndex: number;
    durationTickCounter: number;
    turnNumber: number;
    phase: GamePhase;
    log: GameLogEntry[];
    winnerId?: string;
}
export interface PlayCardAction {
    cardId: string;
    targetId: string;
}
export interface RoomInfo {
    roomId: string;
    playerCount: number;
    isFull: boolean;
}
export declare const BUFF_NAMES: Record<BuffType, string>;
export declare const COST_TYPE_NAMES: Record<CostType, string>;
//# sourceMappingURL=types.d.ts.map