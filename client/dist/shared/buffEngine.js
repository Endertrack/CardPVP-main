import { displayMessage } from '../client/src/store/notificationStore';
import { damage, DamageType, heal } from './cardEngine';
import { BuffType } from './types';
/**
 * Buff 引擎 — 纯函数，事件驱动
 */
// ===== 工具函数 =====
export function deepClonePlayer(p) {
    return JSON.parse(JSON.stringify(p));
}
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
export function getBuffStacks(player, type, sourcePlayerId) {
    return player.buffs
        .filter(b => b.buffType === type && (!sourcePlayerId || b.sourcePlayerId === sourcePlayerId))
        .reduce((sum, b) => sum + b.stacks, 0);
}
export function findBuff(player, type) {
    return player.buffs.find(b => b.buffType === type);
}
// ===== 应用效果到玩家 =====
export function applyEffectToPlayer(player, buffType, value, duration, sourceCardId, sourcePlayerId, opponent, state) {
    const stacks = value; // 每次应用效果时，value即为层数/强度
    // 非正数层数/强度时跳过
    if (stacks <= 0 || value <= 0)
        return player;
    // 钻石胸甲
    if (player.equipment?.equip?.name === '钻石胸甲' && buffType === BuffType.Shield) {
        heal(player, player, value, opponent, state);
        displayMessage(`${player.name}装备了钻石胸甲，${value}点护盾转化为血量`);
        return;
    }
    // 村庄：免疫尸潮
    if (player.equipment?.field?.name === '村庄' && buffType === BuffType.Horde) {
        displayMessage(`${player.name}装备了村庄，免疫尸潮`);
        return;
    }
    // 同类型且剩余回合数相同 → 合并层数
    const existing = player.buffs.find(b => b.buffType === buffType && b.remainingTurns === duration);
    if (existing) {
        existing.stacks += stacks;
        existing.value = Math.max(existing.value, value);
        return;
    }
    player.buffs.push({
        buffType: buffType,
        value,
        stacks,
        remainingTurns: duration,
        sourceCardId,
        sourcePlayerId,
    });
}
// ===== 回合开始处理 =====
export function processTurnStartBuffs(player, opponent, opponentId, state) {
    let p = deepClonePlayer(player);
    // 龙息/尸潮/治愈：打出者（p）回合开始时触发
    // 检查所有人身上由 p 施加的 buff，source 统一为 p
    // 1. 自身施加给自己的（自施场景，如 A 对 A 用龙息）
    const selfDamage = getBuffStacks(p, BuffType.Damage, p.id);
    if (selfDamage > 0)
        damage(p, p, DamageType.Real, selfDamage, false);
    const selfHorde = getBuffStacks(p, BuffType.Horde, p.id);
    if (selfHorde > 0)
        damage(p, p, DamageType.Physical, selfHorde, true);
    const selfHeal = getBuffStacks(p, BuffType.Heal, p.id);
    if (selfHeal > 0)
        heal(p, p, selfHeal, opponent, state);
    // 2. 对方身上由自己施加的（外施场景，如 A 对 B 用龙息）
    const outDamage = getBuffStacks(opponent, BuffType.Damage, p.id);
    if (outDamage > 0)
        damage(p, opponent, DamageType.Real, outDamage, false);
    const outHorde = getBuffStacks(opponent, BuffType.Horde, p.id);
    if (outHorde > 0)
        damage(p, opponent, DamageType.Physical, outHorde, true);
    const outHeal = getBuffStacks(opponent, BuffType.Heal, p.id);
    if (outHeal > 0)
        heal(p, opponent, outHeal, p, state);
    //钻石胸甲：每回合开始时获得1层抗性
    if (player.equipment?.equip?.name === '钻石胸甲' && player.equipment?.equip?.sourcePlayerId === opponentId) {
        applyEffectToPlayer(p, BuffType.Resistance, 1, 1, 'card_23', p.id);
    }
    //海龟壳：每回合开始时获得抗火
    if (player.equipment?.equip?.name === '海龟壳' && player.equipment?.equip?.sourcePlayerId === opponentId) {
        applyEffectToPlayer(p, BuffType.FireResist, 1, 1, 'card_26', p.id);
    }
    //三叉戟：每回合开始时获得1层力量
    if (player.equipment?.weapon?.name === '三叉戟' && player.equipment?.weapon?.sourcePlayerId === opponentId) {
        applyEffectToPlayer(p, BuffType.Strength, 1, 1, 'card_27', p.id);
    }
    return p;
}
// ===== 回合结束处理 =====
export function processTurnEndBuffs(player, opponentId) {
    let p = deepClonePlayer(player);
    p.buffs = p.buffs
        .map(buff => {
        const b = { ...buff };
        // 只减少来自对方施加的限时 buff 的 remainingTurns
        // 这样每个 buff 从被施加到被减少，完整走过了1个回合
        if (b.remainingTurns !== undefined && b.sourcePlayerId === opponentId) {
            b.remainingTurns -= 1;
        }
        return b;
    })
        .filter(b => {
        if (b.value <= 0)
            return false;
        if (b.stacks <= 0)
            return false;
        if (b.remainingTurns !== undefined && b.remainingTurns <= 0)
            return false;
        return true;
    });
    return p;
}
//# sourceMappingURL=buffEngine.js.map