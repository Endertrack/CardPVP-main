// ===== 卡牌消耗类型 =====
export var CostType;
(function (CostType) {
    CostType["Action"] = "action";
    CostType["Strategy"] = "strategy";
    CostType["Heal"] = "heal";
    CostType["Attack"] = "attack";
    CostType["Buff"] = "buff";
    CostType["Debuff"] = "debuff";
    CostType["Event"] = "event";
    CostType["Equip"] = "equip";
    CostType["Weapon"] = "weapon";
    CostType["Field"] = "field";
    CostType["Counter"] = "counter";
})(CostType || (CostType = {}));
// ===== Buff 类型 =====
export var BuffType;
(function (BuffType) {
    BuffType["Strength"] = "strength";
    BuffType["Weakness"] = "weakness";
    BuffType["Resistance"] = "resistance";
    BuffType["Vulnerability"] = "vuln";
    BuffType["Heal"] = "heal";
    BuffType["Wither"] = "wither";
    BuffType["Shield"] = "shield";
    BuffType["FireResist"] = "fireResist";
    BuffType["Poison"] = "poison";
    BuffType["FireVuln"] = "fireVuln";
    //Charge = 'charge',          // buff11 蓄力
    BuffType["HealBoost"] = "healBoost";
    BuffType["LockAction"] = "lockAction";
    BuffType["LockStrategy"] = "lockStrategy";
    BuffType["WitherOnDraw"] = "witherOnDraw";
    BuffType["DamageBoost"] = "damageBoost";
    BuffType["RemoveWither"] = "removeWither";
    BuffType["ReduceDuration"] = "reduceDuration";
    BuffType["ReduceMaxHp"] = "reduceMaxHp";
    BuffType["IncreaseMaxHp"] = "increaseMaxHp";
    BuffType["ConditionalDiscard"] = "conditionalDiscard";
    BuffType["PhysicalDamage"] = "phydamage";
    BuffType["Damage"] = "damage";
    BuffType["DrawCard"] = "drawCard";
    BuffType["StealCard"] = "stealCard";
    BuffType["RevealHand"] = "revealHand";
    BuffType["ForceDiscardEquip"] = "forceDiscardEquip";
    BuffType["DamageOnDiscard"] = "damageOnDiscard";
    BuffType["HealPerBuff"] = "healPerBuff";
    BuffType["HealAll"] = "healAll";
    BuffType["Horde"] = "horde";
    BuffType["Blight"] = "blight";
    BuffType["Block"] = "block";
    BuffType["EnchantBurst"] = "enchantBurst";
})(BuffType || (BuffType = {}));
// ===== 游戏阶段 =====
export var GamePhase;
(function (GamePhase) {
    GamePhase["Waiting"] = "waiting";
    GamePhase["Playing"] = "playing";
    GamePhase["GameOver"] = "gameOver";
})(GamePhase || (GamePhase = {}));
// ===== Buff 名称映射（显示用） =====
export const BUFF_NAMES = {
    [BuffType.Strength]: '力量',
    [BuffType.Weakness]: '虚弱',
    [BuffType.Resistance]: '抗性',
    [BuffType.Vulnerability]: '易伤',
    [BuffType.Heal]: '生命恢复',
    [BuffType.Wither]: '凋零',
    [BuffType.Shield]: '护盾',
    [BuffType.FireResist]: '抗火',
    [BuffType.Poison]: '中毒',
    [BuffType.FireVuln]: '易燃',
    [BuffType.HealBoost]: '治愈增强',
    [BuffType.LockAction]: '行动封锁',
    [BuffType.LockStrategy]: '锦囊封锁',
    [BuffType.WitherOnDraw]: '陷阱',
    [BuffType.DamageBoost]: '暴击',
    [BuffType.RemoveWither]: '移除凋零',
    [BuffType.ReduceDuration]: '缩减时效',
    [BuffType.ReduceMaxHp]: '生命上限降低',
    [BuffType.IncreaseMaxHp]: '生命上限提升',
    [BuffType.ConditionalDiscard]: '条件丢弃',
    [BuffType.PhysicalDamage]: '物理伤害',
    [BuffType.Damage]: '龙息伤害',
    [BuffType.DrawCard]: '摸牌',
    [BuffType.StealCard]: '抽牌',
    [BuffType.RevealHand]: '展示手牌',
    [BuffType.ForceDiscardEquip]: '强制卸装',
    [BuffType.DamageOnDiscard]: '丢弃伤害',
    [BuffType.HealPerBuff]: '状态回血',
    [BuffType.HealAll]: '全体回血',
    [BuffType.Horde]: '尸潮',
    [BuffType.Blight]: '枯萎',
    [BuffType.Block]: '格挡',
    [BuffType.EnchantBurst]: '魔咒爆发',
};
// ===== 消耗类型名称 =====
export const COST_TYPE_NAMES = {
    [CostType.Action]: '行动卡',
    [CostType.Strategy]: '锦囊卡',
    [CostType.Heal]: '回血卡',
    [CostType.Attack]: '攻击卡',
    [CostType.Buff]: '增益卡',
    [CostType.Debuff]: '减益卡',
    [CostType.Event]: '事件卡',
    [CostType.Equip]: '装备卡',
    [CostType.Weapon]: '武器卡',
    [CostType.Field]: '场地卡',
    [CostType.Counter]: '策略卡',
};
//# sourceMappingURL=types.js.map