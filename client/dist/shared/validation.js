import { GamePhase, CostType, BuffType } from './types';
import { getCardSubtype } from './cardEngine';
/**
 * 校验出牌动作
 */
export function validatePlayCard(state, playerId, action) {
    // 游戏必须处于进行中
    if (state.phase !== GamePhase.Playing) {
        return { valid: false, error: '游戏未在进行中' };
    }
    // 必须是当前回合玩家
    const currentPlayer = state.players[state.currentTurnIndex];
    if (currentPlayer.id !== playerId) {
        return { valid: false, error: '不是你的回合' };
    }
    // 卡牌必须在手牌中
    const card = currentPlayer.hand.find(c => c.id === action.cardId);
    if (!card) {
        return { valid: false, error: '卡牌不在手牌中' };
    }
    // 目标必须存在（玩家ID）
    const targetExists = state.players.some(p => p.id === action.targetId);
    if (!targetExists) {
        return { valid: false, error: '无效的目标' };
    }
    const player = currentPlayer; // 方便后续使用
    //烈焰粉：不满足条件无法打出
    if (card.name === '烈焰粉' && !player.causePhysicalDamage) {
        return { valid: false, error: '上一张未造成物理伤害，无法打出烈焰粉' };
    }
    /* ===== 附魔台原打出条件（已暂时禁用，保留备用） =====
   //附魔台：不满足条件无法打出
   if (card.name === '附魔台') {
     const checkTypes = [CostType.Heal, CostType.Attack, CostType.Buff, CostType.Debuff, CostType.Event];
     const played = player.playedCardTypesThisTurn || [];
     const matchedTypes = checkTypes.filter(ct => played.includes(ct));
     if (matchedTypes.length < 4) {
       return { valid: false, error: '本回合未打出4种类型牌，无法打出附魔台' };
     }
   }*/
    //玻璃板：无论复制什么类型，都需要剩余至少3次行动/锦囊次数
    if (card.name === '玻璃板') {
        const poolLimit = 5 + (player.actionLimitBonus || 0);
        const remaining = poolLimit - (player.actionStrategyCountThisTurn || 0);
        if (remaining < 3) {
            return { valid: false, error: `打出玻璃板需要剩余至少3次行动/锦囊次数（当前剩余${remaining}次）` };
        }
    }
    // 行动封锁/锦囊封锁检查
    if ((card.costType === CostType.Action || card.costType === CostType.Heal || card.costType === CostType.Attack) && currentPlayer.buffs.some(b => b.buffType === BuffType.LockAction)) {
        return { valid: false, error: '被蜘蛛网封锁，本回合无法使用行动牌' };
    }
    if (card.costType === CostType.Strategy && currentPlayer.buffs.some(b => b.buffType === BuffType.LockStrategy)) {
        return { valid: false, error: '被蜘蛛网封锁，本回合无法使用锦囊牌' };
    }
    // 所有行动牌（含回血/攻击类）+ 锦囊牌 → 先检查共享池
    const subtype = getCardSubtype(card);
    if (card.costType === CostType.Action || card.costType === CostType.Strategy) {
        const poolLimit = 5 + (currentPlayer.actionLimitBonus || 0);
        if ((currentPlayer.actionStrategyCountThisTurn || 0) >= poolLimit) {
            return { valid: false, error: `本回合行动/锦囊牌已达上限(${poolLimit}张)` };
        }
    }
    // 回血类/攻击类：各1张/回合（额外限制）
    if (subtype === 'heal' && (currentPlayer.healCountThisTurn || 0) >= 1) {
        if (player.equipment?.field?.name === '冰原' && (player.attackCountThisTurn || 0) < 1) {
            return { valid: true }; // 冰原场地加成：回血类和攻击类消耗次数互通
        }
        else
            return { valid: false, error: '每回合最多出1张回血类卡牌' };
    }
    if (subtype === 'attack' && (currentPlayer.attackCountThisTurn || 0) >= 1) {
        if (player.equipment?.field?.name === '冰原' && (player.healCountThisTurn || 0) < 1) {
            return { valid: true }; // 冰原场地加成：回血类和攻击类消耗次数互通
        }
        else
            return { valid: false, error: '每回合最多出1张攻击类卡牌' };
    }
    return { valid: true };
}
/**
 * 校验结束回合
 */
export function validateEndTurn(state, playerId) {
    if (state.phase !== GamePhase.Playing) {
        return { valid: false, error: '游戏未在进行中' };
    }
    const currentPlayer = state.players[state.currentTurnIndex];
    if (currentPlayer.id !== playerId) {
        return { valid: false, error: '不是你的回合，无法结束' };
    }
    return { valid: true };
}
//# sourceMappingURL=validation.js.map