import {
  GameState, PlayerState, CardDef, CostType, BuffType,
  GamePhase, GameLogEntry, ActiveBuff, COST_TYPE_NAMES,
  BUFF_NAMES,
} from './types';
import { deepClone, applyEffectToPlayer, getBuffStacks, findBuff } from './buffEngine';
import { CARDS, DEFAULT_HAND_LIMIT } from './constants';
import { handleDiscardBuffs, triggerDiscardEvents, triggerDrawEvents } from './gameEngine';

// 服务端通知 handler（由 server/index.ts 设置，通过 globalThis 跨模块共享）
// target: 'all'=双方都显示 'self'=仅出牌者 'opponent'=仅对手
// category: 'hint'=提示（NotificationToast） 'trigger'=触发效果反馈（TriggerEffectPanel）
export function showMessage(msg: string, target: 'all' | 'self' | 'opponent' = 'all', category: 'hint' | 'trigger' = 'hint') {
  const h = (globalThis as any).__card_notify_handler;
  console.log('[Notify] showMessage:', msg, 'target:', target, 'category:', category, 'handler:', !!h);
  if (h) h(msg, target, category);
}

/** 卡牌效果引擎 — 处理单张卡牌打出的完整流程*/

/** 根据 icon 前缀判断卡牌属于回血类(icon3)还是攻击类(icon4)，替代旧行动卡限制 */
export function getCardSubtype(card: CardDef): 'heal' | 'attack' | null {
  const parts = card.icon.split(',').map(Number);
  // 最后一个数字是 CostType，前面的数字是视觉 icon
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i] === 3) return 'heal';
    if (parts[i] === 4) return 'attack';
  }
  return null;
}

//将卡牌添加到手牌
export function addCardToHand(player: PlayerState, card: CardDef) {
  const handLimit = DEFAULT_HAND_LIMIT + (player.handLimitBonus || 0);
  const equippedCount = [player.equipment.equip, player.equipment.weapon, player.equipment.field].filter(Boolean).length;
  // 4. 手牌上限判断
    if (player.hand.length + equippedCount >= handLimit) {
      // 手牌已达上限：先加入手牌再丢弃（触发丢弃事件）
      player.hand.push(card);
      showMessage(`${player.name}手牌已达上限，丢弃了${card.name}`, 'all', 'trigger');
      handleDiscardBuffs(player); // 触发丢弃事件，处理相关buff

      // 从手牌移除
      player.hand = player.hand.filter(c => c.id !== card.id);
    } else {
      // 正常加入手牌
      player.hand.push(card);
    }

}

export function drawCards(player: PlayerState, count: number): PlayerState {
  let p = deepClone(player);

  for (let i = 0; i < count; i++) {
    // 2. 随机选择一张牌（索引）
    const randomIndex = Math.floor(Math.random() * p.deck.length);
    const sourceCard = p.deck[randomIndex];

    // 3. 复制这张牌到手牌，并赋予新的唯一 ID（防止 ID 冲突）
    const drawn: CardDef = {
      ...sourceCard,
      id: `${sourceCard.id}_drawn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    addCardToHand(p, drawn);

    // 触发摸牌事件（陷阱箱等）
    triggerDrawEvents(p, drawn);

    // 注意：这里没有执行 p.deck.splice 或 shift，原牌堆不变
  }
  return p;
}

// ===== 洗牌 =====
export function shuffleDeck(player: PlayerState): PlayerState {
  const p = deepClone(player);
  const deck = [...p.deck];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  p.deck = deck;
  return p;
}

// ===== 从手牌移除卡牌 =====
function removeFromHand(player: PlayerState, cardId: string): PlayerState {
  const p = deepClone(player);
  p.hand = p.hand.filter(c => c.id !== cardId);
  return p;
}

// ===== 应用卡牌效果到目标 =====
export interface ApplyCardResult {
  gameState: GameState;
  logMessages: string[];
}

export function heal(source: PlayerState, target: PlayerState, number: number, opponent?: PlayerState, state?: GameState) {
  let healAmt = Math.max(0, number);
  //治愈增强
  healAmt += getBuffStacks(target, BuffType.HealBoost);
  //枯萎：减少层数等量回血但不消耗层数
  healAmt -= getBuffStacks(target, BuffType.Blight);
  healAmt = Math.max(0, healAmt);

  //凋零：消耗1层，减少1点回血
  const witherStacks = getBuffStacks(target, BuffType.Wither);
  if (witherStacks > 0) {
    const consumed = Math.min(witherStacks, healAmt);
    if(consumed > 0) consumeInPlace(target, BuffType.Wither, consumed);
    healAmt -= consumed;
    // 金护腿：抵消凋零获得护盾
    if (target.equipment?.equip?.name === '金护腿') {
      applyEffectToPlayer(target, BuffType.Shield, consumed, undefined, 'golden_greaves', source.id, opponent, state);
    }
    // 幽匿尖啸体：凋零被清空时，对方随机丢弃一张牌（触发完整丢弃事件）
    if (getBuffStacks(target, BuffType.Wither) === 0
        && target.equipment?.weapon?.name === '幽匿尖啸体' && opponent) {
      if (opponent.hand.length > 0) {
        const idx = Math.floor(Math.random() * opponent.hand.length);
        const [discarded] = opponent.hand.splice(idx, 1);
        opponent.discardPile.push(discarded);
        triggerDiscardEvents(opponent, discarded, state, target);
        showMessage(`幽匿尖啸体触发：${opponent.name}随机丢弃了${discarded.name}`, 'all', 'trigger');
      }
    }
  }
  
  //丛林被动
  if (target.equipment?.field?.name === '丛林') {
    // 凋零清空时：生命上限+1（凋零从有到无时触发）
    if (witherStacks > 0 && getBuffStacks(target, BuffType.Wither) === 0) {
      target.maxHp += 1;
      showMessage(`丛林被动：${target.name}凋零清空，生命上限+1`, 'all', 'trigger');
    }
    // 回血时额外回复1点（每回合限1次）
    if (!target.jungleHpUpTriggered) {
      target.jungleHpUpTriggered = true;
      heal(source, target, 1, opponent, state);
      showMessage(`丛林被动：${target.name}回血额外+1`, 'all', 'trigger');
    }
  }
  
  const overHeal = Math.max(0, target.hp + healAmt - target.maxHp);
  //实际回血
  target.hp = Math.min(target.maxHp, target.hp + healAmt);
  //血量溢出提示
  if (overHeal > 0) {
    showMessage(`${target.name}血量溢出${overHeal}点`, 'all', 'trigger');
  }

  //中毒：回血后受伤
  const poisonStacks = getBuffStacks(target, BuffType.Poison);
  if (poisonStacks > 0) {
    damage(target, target, DamageType.Real, poisonStacks, false);
    showMessage(`${target.name}中毒，扣除${poisonStacks}点血量`, "all", 'trigger');
  }
  showMessage(`${target.name}回复了${healAmt}点血量`, "all", 'trigger');
  return healAmt;
}
export enum DamageType {
  Physical,
  Fire,
  Real
}
/** 原地消耗 buff 层数（修改原对象 buffs 数组，不创建新对象） */
export function consumeInPlace(player: PlayerState, type: BuffType, amount: number): number {
  let remaining = amount;
  for (const b of player.buffs) {
    if (b.buffType !== type || remaining <= 0) continue;
    const c = Math.min(remaining, b.stacks);
    b.stacks -= c; remaining -= c;
  }
  player.buffs = player.buffs.filter(b => b.stacks > 0);
  return amount - remaining;
}

export function damage(source: PlayerState, target: PlayerState, type: DamageType, base: number, isCard: boolean): number {
  let number = Math.max(0, base);
  if(type === DamageType.Physical) {
    //力量（所有实例求和）
    number += getBuffStacks(source, BuffType.Strength);
    //虚弱（所有实例求和）
    number -= getBuffStacks(source, BuffType.Weakness);
    //抗性（所有实例求和）
    number -= getBuffStacks(target, BuffType.Resistance);
    //易伤
    number += getBuffStacks(target, BuffType.Vulnerability);
    //护盾
    const shieldStacks = getBuffStacks(target, BuffType.Shield);
    if (shieldStacks > 0) {
      const blocked = Math.min(shieldStacks, Math.max(0, number));
      if (blocked > 0) {
        consumeInPlace(target, BuffType.Shield, blocked);
        number -= blocked;
      }
    }
    //格挡：减5点物理伤害，消耗全部层数后状态消失
    const blockStacks = getBuffStacks(target, BuffType.Block);
    if (blockStacks > 0) {
      const reduced = Math.min(blockStacks, number);
      number -= reduced;
      consumeInPlace(target, BuffType.Block, blockStacks);
      showMessage(`${target.name}触发格挡，减少了${reduced}点物理伤害`, "all", 'trigger');
    }
    //侦测器暴击
    const dmgBoost = getBuffStacks(source, BuffType.DamageBoost);
    if (dmgBoost > 0) {
      number = Math.ceil(number * 1.5);
      consumeInPlace(source, BuffType.DamageBoost, dmgBoost);
      showMessage(`${source.name}触发暴击，物理伤害提升50%`, "all", 'trigger');
    }
    //滴水石锥（物伤回血）
    if (source.equipment?.weapon?.name === '滴水石锥') {
      heal(source, source, 1, target);
      showMessage(`滴水石锥触发`, "all", 'trigger');
    }
    //烈焰棒：标记触发条件
    if (source.equipment?.weapon?.name === '烈焰棒') {
      source.causePhysicalDamage = true;
      showMessage('丢弃一张牌可造成2点火焰伤害', "self")
    }
    //烈焰粉提示
    if(!source.blazePowderUsedThisTurn && source.hand.filter(card => card.name === '烈焰粉').length > 0) {
      source.causePhysicalDamage = true;
      showMessage('打出烈焰粉可额外造成3点火焰伤害', "self");
    }
    //幽匿尖啸体：造成物理伤害时所有人增加1点凋零
    if (source.equipment?.weapon?.name === '幽匿尖啸体') {
      applyEffectToPlayer(source, BuffType.Wither, 1, undefined, 'hidden_screamer', source.id);
      applyEffectToPlayer(target, BuffType.Wither, 1, undefined, 'hidden_screamer', source.id);
      showMessage(`幽匿尖啸体触发，所有人增加1点凋零`, "all", 'trigger');
    }
    //护盾：受到物理伤害时触发buff
    if (target.equipment?.equip?.name === '盾牌') {
      applyEffectToPlayer(source, BuffType.LockAction, 1, 1, 'shield', target.id);
      applyEffectToPlayer(source, BuffType.LockStrategy, 1, 1, 'shield', target.id);
      applyEffectToPlayer(source, BuffType.DamageOnDiscard, 3, 1, 'shield', target.id);
      showMessage(`盾牌触发，对方爽飞了`, "all", 'trigger');
    }

  } else if(type === DamageType.Fire) {
    //抗火：免疫
    const fireResist = getBuffStacks(target, BuffType.FireResist);
    if (fireResist > 0) return 0;
    //火焰易伤：增加火焰伤害
    number += getBuffStacks(target, BuffType.FireVuln);
    //海洋之心：失去并抵消火焰伤害
    const oceanHeartIdx = target.hand.findIndex(c => c.name === '海洋之心');
    if (oceanHeartIdx !== -1) {
      const [discarded] = target.hand.splice(oceanHeartIdx, 1);
      showMessage(`${target.name}失去${discarded.name}，抵消了火焰伤害`, 'all', 'trigger');
      return 0;
    }
 
  } else if(type === DamageType.Real) {
    //真实伤害：无视所有buff
    target.hp = Math.max(0, target.hp - number);
    showMessage(`${target.name}受到了${number}点魔法伤害`, "all", 'trigger');
    return number;
  }

  //三叉戟：攻击凋零目标额外伤害
  if (source.equipment?.weapon?.name === '三叉戟') {
    const hasWither = target.buffs.some(b => b.buffType === BuffType.Wither && b.stacks > 0);
    if (hasWither) {
      number += 1;
      showMessage(`三叉戟增伤触发：伤害+1`, "all", 'trigger');
    }
  }
  target.hp = Math.max(0, target.hp - number);
  
  showMessage(`${target.name}受到了${number}点伤害`, "all", 'trigger');
  return number;
}

export function applyCard(
  gameState: GameState,
  playerId: string,
  targetId: string,
  card: CardDef
): ApplyCardResult {
  const state = deepClone(gameState);
  const msgs: string[] = [];

  const playerIndex = state.players.findIndex(p => p.id === playerId);
  const targetIndex = state.players.findIndex(p => p.id === targetId);
  if (playerIndex === -1 || targetIndex === -1) {
    return { gameState: state, logMessages: ['无效的玩家或目标'] };
  }

  const isSelfTarget = playerIndex === targetIndex;
  const cardName = card.name;

  // ===== 用一份统一的状态 p 代表卡牌使用者 =====
  // 效果产生"攻击者"和"防御者"两份修改时，最终合并回 p
  let p = deepClone(state.players[playerIndex]);
  // 当目标非己时，targetState 是另一个玩家
  let t = isSelfTarget ? p : deepClone(state.players[targetIndex]);
  // 记录卡牌处理前的血量，用于日志末尾追加血量变化
  const oldHpP = p.hp;
  const oldHpT = isSelfTarget ? p.hp : t.hp;

  // 【新增】建立一个映射表，方便在循环中找到对应的副本
// 这样我们在遍历所有玩家造成伤害时，能修改到 p 或 t，而不是去改 state.players
const playerClones = new Map<string, PlayerState>();
playerClones.set(p.id, p);
if (!isSelfTarget) {
    playerClones.set(t.id, t);
}

  // 从手牌移除
  p = removeFromHand(p, card.id);

  // 更新消耗计数
  const subtype = getCardSubtype(card);
  if (subtype === 'heal') {
    if (p.equipment?.field?.name === '冰原' && (p.healCountThisTurn || 0) >=1) {
      showMessage(`${p.name}触发冰原效果`, 'all', 'trigger');
      p.attackCountThisTurn = (p.attackCountThisTurn || 0) + 1; // 冰原场地加成：回血类和攻击类消耗次数互通
    } else p.healCountThisTurn = (p.healCountThisTurn || 0) + 1;
  }
  if (subtype === 'attack'){
    if (p.equipment?.field?.name === '冰原' && (p.attackCountThisTurn || 0) >=1) {
      showMessage(`${p.name}触发冰原效果`, 'all', 'trigger');
      p.healCountThisTurn = (p.healCountThisTurn || 0) + 1; // 冰原场地加成：回血类和攻击类消耗次数互通
    } else p.attackCountThisTurn = (p.attackCountThisTurn || 0) + 1;
  }
  // 所有行动牌（含回血/攻击类）+ 锦囊牌 → 共享池
  if (card.costType === CostType.Action || card.costType === CostType.Strategy) {
    p.actionStrategyCountThisTurn = (p.actionStrategyCountThisTurn || 0) + 1;
  }

  // 记录本回合消耗类型（附魔台用）
  if (!p.playedCardTypesThisTurn.includes(card.costType)) {
    p.playedCardTypesThisTurn.push(card.costType);
  }
  // 按 icon 前缀补充记录子类型（附魔台需要，因为 costType 不再区分回血/攻击/增益/减益/事件）
  const iconNums = card.icon.split(',').map(Number).slice(0, -1);
  for (const num of iconNums) {
    const mappedType = num === 3 ? CostType.Heal
      : num === 4 ? CostType.Attack
      : num === 5 ? CostType.Buff
      : num === 6 ? CostType.Debuff
      : num === 7 ? CostType.Event
      : null;
    if (mappedType && !p.playedCardTypesThisTurn.includes(mappedType)) {
      p.playedCardTypesThisTurn.push(mappedType);
    }
  }

  // 更新上一张牌为当前这张（玻璃板本身不在此 push，改在下方玻璃板特殊处理中手动 push）
  if (card.name !== '玻璃板') {
    p.lastPlayedCardDef.push(card);
    p.lastPlayedCardSelfTarget.push(isSelfTarget);
  }
  
  //处理烈焰粉判断逻辑
  if(card.name !== '烈焰粉' && p.causePhysicalDamage) p.causePhysicalDamage = false;

  // 处理装备/武器/场地替换（始终作用在卡牌使用者身上）
  if (card.costType === CostType.Equip ||
      card.costType === CostType.Weapon ||
      card.costType === CostType.Field) {
    const slotKey = card.costType === CostType.Equip ? 'equip'
                  : card.costType === CostType.Weapon ? 'weapon' : 'field';
    const target = isSelfTarget ? p : t;
    if (target.equipment[slotKey]) {
      const oldCard = target.equipment[slotKey]!;
      handleDiscardBuffs(p); // 触发丢弃事件，处理相关buff
      msgs.push(`丢弃了${oldCard.name}`);
    }
    const modifiedCard = { ...card, sourcePlayerId: p.id }; // 记录装备来源玩家ID，供buff计算时参考
    target.equipment[slotKey] = modifiedCard;
    if (isSelfTarget) p = target; else t = target;
    msgs.push(`${cardName}已装备`);
  }

  // ===== 逐条执行效果 =====
  for (const effect of card.effects) {
    const targetLabel = isSelfTarget ? '自己' : '对手';

    if (effect.buffType === BuffType.Heal) {
      if (effect.duration && effect.duration > 0) {
        // 持续回血（治愈 buff，每回合回复）
        const target = isSelfTarget ? p : t;
        applyEffectToPlayer(target, BuffType.Heal, effect.value, effect.duration, card.id, p.id);
        heal(p, target, effect.value, isSelfTarget ? state.players[1 - playerIndex] : p, state);
        msgs.push(`${cardName}使${targetLabel}获得生命回复${effect.value}（持续${effect.duration}回合）`);
      } else {// 即时回血
        const target = isSelfTarget ? p : t;
        heal(p, target, effect.value, isSelfTarget ? state.players[1 - playerIndex] : p, state);
      }

    } else if (effect.buffType === BuffType.HealAll) {
      // 全体回血（无论目标选择，双方都回血）
      heal (p, p, effect.value, isSelfTarget ? state.players[1 - playerIndex] : t, state);
      heal (p, state.players[1 - state.currentTurnIndex], effect.value, p, state);
      // msgs.push(`${cardName}为双方回复了${effect.value}点血量`);
    } else if (effect.buffType === BuffType.PhysicalDamage) {
      //物理伤害
      const target = isSelfTarget ? p : t;
      damage(p, target, DamageType.Physical, effect.value, true);
    } else if (effect.buffType === BuffType.Damage) {
      // 魔法伤害
      const target = isSelfTarget ? p : t;
      if (effect.duration && effect.duration > 0) {
        // 持续真伤
        applyEffectToPlayer(target, BuffType.Damage, effect.value, effect.duration, card.id, p.id);
        damage(target, target, DamageType.Real, effect.value, true);
        msgs.push(`${cardName}使${targetLabel}获得龙息${effect.value}点（${effect.duration}回合）`);
      } else damage(p, target, DamageType.Real, effect.value, true);
    } else if (effect.buffType === BuffType.RemoveWither) {
      // 移除凋零
      const target = isSelfTarget ? p : t;
      const witherIdx = target.buffs.findIndex(b => b.buffType === BuffType.Wither);
      if (witherIdx !== -1) {
        const buff = target.buffs[witherIdx];
        const removed = Math.min(effect.value, buff.stacks);
        buff.stacks -= removed;
        const witherCleared = buff.stacks <= 0;
        if (witherCleared) target.buffs.splice(witherIdx, 1);
        msgs.push(`${cardName}为${targetLabel}移除了${removed}层凋零`);
        showMessage(`目标移除了${removed}层凋零`, 'all', 'trigger');
        // 幽匿尖啸体：凋零被清空时，对方随机丢弃一张牌（触发完整丢弃事件）
        if (witherCleared && target.equipment?.weapon?.name === '幽匿尖啸体') {
          const opp = isSelfTarget ? state.players[1 - playerIndex] : p;
          if (opp.hand.length > 0) {
            const idx = Math.floor(Math.random() * opp.hand.length);
            const [discarded] = opp.hand.splice(idx, 1);
            opp.discardPile.push(discarded);
            triggerDiscardEvents(opp, discarded, state, target);
            showMessage(`幽匿尖啸体触发：${opp.name}随机丢弃了${discarded.name}`, 'all', 'trigger');
          }
        }
        // 丛林被动：凋零清空时生命上限+1
        if (witherCleared && target.equipment?.field?.name === '丛林') {
          target.maxHp += 1;
          showMessage(`丛林被动：${target.name}凋零清空，生命上限+1`, 'all', 'trigger');
        }
      } else {
        msgs.push(`(${cardName})目标没有凋零`);
      }
      if (isSelfTarget) p = target; else t = target;

    } else if (effect.buffType === BuffType.ReduceDuration) {
      // 减少限时状态回合数
      const target = isSelfTarget ? p : t;
      target.buffs = target.buffs
        .map(buff => {
          if (buff.remainingTurns === undefined) return buff;
          return { ...buff, remainingTurns: Math.max(0, buff.remainingTurns - 1) };
        })
        .filter(b => b.remainingTurns === undefined || b.remainingTurns > 0);
      msgs.push(`${cardName}使${targetLabel}所有限时状态剩余回合-1`);
      if (isSelfTarget) p = target; else t = target;

    } else if (effect.buffType === BuffType.ReduceMaxHp) {
      // 降低生命上限（固定值）
      const target = isSelfTarget ? p : t;
      const reduction = Math.min(effect.value, target.maxHp - 1);
      target.maxHp = Math.max(1, target.maxHp - reduction);
      target.hp = Math.min(target.hp, target.maxHp);
      msgs.push(`${cardName}使${targetLabel}生命上限降低${reduction}点`);
      showMessage(`${targetLabel}生命上限降低${reduction}点`, 'all', 'trigger');
      if (isSelfTarget) p = target; else t = target;

    } else if (effect.buffType === BuffType.IncreaseMaxHp) {
      // 提升生命上限
      const target = isSelfTarget ? p : t;
      target.maxHp += effect.value;
      msgs.push(`${cardName}使${targetLabel}生命上限提升${effect.value}点`);
      if (isSelfTarget) p = target; else t = target;
    }else if (effect.buffType === BuffType.ConditionalDiscard) {
    // 条件丢弃：检查目标手牌是否有<烟花>或<龙息>，有则随机丢弃一张，否则造成伤害
    const target = isSelfTarget ? p : t;
    
    // 查找目标手牌中是否存在 '烟花' 或 '龙息' 或 '重生锚'
    const discardCandidateIdx = target.hand.findIndex(c => c.name === '烟花' || c.name === '龙息' || c.name === '重生锚');

    if (discardCandidateIdx !== -1) {
        // 如果有，随机丢弃一张符合条件的牌（这里逻辑为：如果找到了索引，则丢弃该索引对应的牌）
        // 原逻辑也是找到索引后直接丢弃，因为 findIndex 返回的是第一个匹配项，相当于在匹配的牌中随机选了一张
        const [discarded] = target.hand.splice(discardCandidateIdx, 1);
        handleDiscardBuffs(target);
        if (isSelfTarget) p = target; else t = target;
        msgs.push(`${cardName}使${targetLabel}丢弃了${discarded.name}`);
        showMessage(`目标丢弃了${discarded.name}`, 'all', 'trigger');
    } else {
        // 否则给予尸潮并造成伤害
        applyEffectToPlayer(target, BuffType.Horde, 4, 2, card.id, p.id);
        damage(p, target, DamageType.Physical, 4, true);
        if (isSelfTarget) p = target; else t = target;
        msgs.push(`${cardName}给予${targetLabel} 2回合尸潮`);
        showMessage(`给予了${targetLabel} 2回合尸潮`, 'all', 'trigger');
    }

    } else if (effect.buffType === BuffType.DrawCard) {
      // 摸牌
      const target = isSelfTarget ? p : t;
      const oldHandLen = target.hand.length;
      const drawn = drawCards(target, effect.value);
      const newCards = drawn.hand.length - oldHandLen;
      msgs.push(`${cardName}使${targetLabel}摸了${Math.max(0, newCards)}张牌`);
      if (isSelfTarget) p = drawn; else t = drawn;

    } else if (effect.buffType === BuffType.StealCard) {
      // 抽取目标一张手牌
      if (t.hand.length > 0) {
        const idx = Math.floor(Math.random() * t.hand.length);
        const [stolen] = t.hand.splice(idx, 1);
        addCardToHand(p, stolen);
        msgs.push(`${cardName}从${targetLabel}手中偷走了${stolen.name}`);
        showMessage(`偷走了${stolen.name}`, 'all', 'trigger');
      } else {
        msgs.push(`(${cardName})目标手牌为空`);
        showMessage(`目标手牌为空`, 'all', 'trigger');
      }

    } else if (effect.buffType === BuffType.RevealHand) {
      // 展示手牌：在日志中记录目标手牌信息
      const target = isSelfTarget ? p : t;
      const count = Math.min(effect.value, target.hand.length);
      const revealed = target.hand.slice(0, count).map(c => c.name).join('、');
      msgs.push(`揭示的手牌：${revealed}`);
      showMessage(`揭示的手牌：${revealed}`, 'all', 'trigger');
      if (isSelfTarget) p = target; else t = target;

    } else if (effect.buffType === BuffType.ForceDiscardEquip) {
      // 强制丢弃装备/武器/场地
      const target = isSelfTarget ? p : t;
      const slots = ['equip', 'weapon', 'field'] as const;
      const equipped = slots.filter(s => target.equipment[s]);
      if (equipped.length > 0) {
        const slot = equipped[Math.floor(Math.random() * equipped.length)];
        const discarded = target.equipment[slot]!;
        delete target.equipment[slot];
        handleDiscardBuffs(target);
        msgs.push(`${cardName}使${targetLabel}丢弃了${discarded.name}`);
        showMessage(`目标丢弃了${discarded.name}`, 'all', 'trigger');
      } else {
        msgs.push(`(${cardName})目标没有装备`);
      }
      if (isSelfTarget) p = target; else t = target;

    } else if (effect.buffType === BuffType.DamageOnDiscard) {
      // 丢弃伤害Debuff
      const target = isSelfTarget ? p : t;
      applyEffectToPlayer(target, BuffType.DamageOnDiscard, effect.value, effect.duration, card.id, p.id);
      msgs.push(`${cardName}使${targetLabel}在丢弃牌时受到${effect.value}点伤害（持续${effect.duration}回合）`);
    } else if (effect.buffType === BuffType.HealPerBuff) {
      // 每存在一种状态回1点血
      const target = isSelfTarget ? p : t;
      // 统计不同的buff类型数量（排除特殊类型）
      const buffTypes = new Set(p.buffs.map(b => b.buffType));
      heal(p, target, buffTypes.size, isSelfTarget ? state.players[1 - playerIndex] : p, state);
      msgs.push(`${cardName}为${targetLabel}回复了${buffTypes.size}点血量`);
      if (isSelfTarget) p = target; else t = target;
    } else {
      // 其他Buff效果
      const target = isSelfTarget ? p : t;
      applyEffectToPlayer(target, effect.buffType, effect.value, effect.duration, card.id, p.id);
      msgs.push(`${cardName}对${target.name}施加了${effect.value}层${BUFF_NAMES[effect.buffType]}${effect.duration ? `（持续${effect.duration}回合）` : ''}`);
    }
  }

  // ===== 特殊卡牌处理 =====
// 仙人掌：对所有人造成物理伤害
if (card.name === '仙人掌') {
    // 1. 先对“自己”的副本造成伤害
    // 注意：这里必须用 p（自己当前的副本），不能用 state.players
    damage(p, p, DamageType.Physical, 1, true);
    
    // 2. 再对“对手”的副本造成伤害
    // 如果目标是别人（isSelfTarget 为 false），t 就是对手的副本
    // 如果目标是自己（isSelfTarget 为 true），t 其实就是 p（或者不需要单独处理）
    if (!isSelfTarget) {
        damage(p, t, DamageType.Physical, 1, true);
    } else {
        // 如果目标是自己，其实上面第一步已经打过了（因为 p 就是目标）。
        // 但为了逻辑严谨（模拟“对所有人”），我们依然调用一次 damage。
        // 此时 t 就是 p，但为了保险，我们还是传入 p 作为受害者。
        damage(p, p, DamageType.Physical, 1, true); // 或者 damage(p, t, ...) 此时 t===p
    }
    
    msgs.push(`${cardName}对所有玩家造成了1点物理伤害`);
}

  // 蜘蛛网：设置待选封锁类型
  if (card.name === '蜘蛛网') {
    p.pendingBucketChoice = 'pending';
  }

  // 诡异钓竿：设置待选装备
  if (card.name === '诡异钓竿') {
    if (t.equipment) {
    p.pendingEquipChoice = 'pending';
    p.pendingEquipCard = card; // 存储打出的卡牌，取消时用于返还
    } else {
      showMessage('诡异钓竿：目标没有装备', 'self');
    }
  }

  // 玻璃板：复制上一张牌的效果
  if (card.name === '玻璃板') {
    // 保存当前的 lastPlayedCardDef / lastPlayedCardSelfTarget（玻璃板在 L340 被排除，未 push）
    const beforePlayedDef = [...(p.lastPlayedCardDef || [])];
    const beforeSelfTarget = [...(p.lastPlayedCardSelfTarget || [])];

    // 找最后一张非玻璃板的牌（避免连续玻璃板无限递归）
    let lastCard: CardDef | null = null;
    for (let i = p.lastPlayedCardDef.length - 1; i >= 0; i--) {
      if (p.lastPlayedCardDef[i].name !== '玻璃板') {
        lastCard = p.lastPlayedCardDef[i];
        break;
      }
    }

    if (lastCard) {
      // 1. 保存当前的消耗次数（此时已经包含了玻璃板作为锦囊牌自身消耗的 1 次）
      const beforeActionCount = p.actionStrategyCountThisTurn || 0;

      const newState = deepClone(gameState);
      newState.players[playerIndex] = p;
      newState.players[1 - playerIndex] = t;
      const result = applyCard(newState, playerId, targetId, lastCard);
      const pIdx = result.gameState.players.findIndex(pl => pl.id === playerId);
      p = result.gameState.players[pIdx];
      t = result.gameState.players[1 - pIdx];
      
      // 2. 撤销内部 applyCard 造成的消耗次数变化，恢复到只有玻璃板自身 1 次消耗的状态
      p.actionStrategyCountThisTurn = beforeActionCount;
      // 撤销内部 applyCard 对 lastPlayedCardDef/SelfTarget 的 push，改为 push 玻璃板本体
      p.lastPlayedCardDef = [...beforePlayedDef];
      p.lastPlayedCardSelfTarget = [...beforeSelfTarget];

      msgs.push(`玻璃板复制了「${lastCard.name}」的效果`);
      showMessage(`玻璃板复制了「${lastCard.name}」的效果`, 'all', 'trigger');
      result.logMessages.forEach(msg => msgs.push(msg));
      
      // 3. 手动追加消耗：如果复制的是行动牌，总共需消耗 3 次
      if (lastCard.costType === CostType.Action) {
        // beforeActionCount 已经包含了玻璃板的 1 次，再 +2 即代表这张玻璃板总共消耗了 3 次
        p.actionStrategyCountThisTurn = beforeActionCount + 2; 
        msgs[msgs.length - 1] += '（总共消耗3次行动/锦囊次数）';
      }
    } else {
      msgs.push('玻璃板没有可复制的牌');
    }

    // 无论是否复制成功，都 push 玻璃板本体（让弹窗显示玻璃板而非被复制牌）
    p.lastPlayedCardDef.push(card);
    p.lastPlayedCardSelfTarget.push(isSelfTarget);
  }


  // 侦测器：展示一张随机对手手牌，记录待猜权重
  if (card.name === '侦测器') {
    if (!isSelfTarget && t.hand.length > 0) {
      const randIdx = Math.floor(Math.random() * t.hand.length);
      const revealedCard = t.hand[randIdx];
      const w = revealedCard.weight || 0;
      // 将待猜信息存到玩家状态中
      p.pendingGuessCardId = revealedCard.id;
      p.pendingGuessCardWeight = w;
      p.pendingGuessCardName = revealedCard.name;
    } else {
      showMessage('侦测器：目标手牌为空', 'self');
    }
  }

  if (card.name === '附魔台') {
    p.enchantBurstReady = false; // 获得当回合无法触发
  }

  // 运输矿车：从牌组抽4张牌展示，双方轮流选
  if (card.name === '运输矿车') {
    if (p.deck.length >= 4) {
      const deckCards = p.deck.splice(0, 4);
      p.draftCards = deckCards.map(c => JSON.parse(JSON.stringify(c)));
      p.draftPlayerPick = 0; // 当前玩家先选
      p.draftPickCount = 0;
    }
  }

  // 烈焰粉：上一张牌造成物理伤害后打出额外造成火焰伤害（每回合限1次）
  if (card.name === '烈焰粉' && p.causePhysicalDamage && !p.blazePowderUsedThisTurn) {
    damage(p, t, DamageType.Fire, 3, true);
    p.causePhysicalDamage = false;
    p.blazePowderUsedThisTurn = true;
  }

  // 重生锚：造成2点火焰伤害
  if (card.name === '重生锚') {
    damage(p, t, DamageType.Fire, 2, true);
  }

  // ===== 写入状态 =====
  if (isSelfTarget) {
    state.players[playerIndex] = p;  // p 已包含所有变化
  } else {
    state.players[playerIndex] = p;
    state.players[targetIndex] = t;
  }

  // 检查胜负
  for (const p of state.players) {
    if (p.hp <= 0) {
      state.phase = GamePhase.GameOver;
      state.winnerId = state.players.find(pl => pl.id !== p.id)?.id;
      msgs.push(`${p.name}的HP降为0，${state.winnerId ? state.players.find(pl => pl.id === state.winnerId)?.name : '对方'}获胜！`);
      break;
    }
  }

  // 记录日志（末尾追加血量变化）
  const newHpP = state.players[playerIndex].hp;
  const newHpT = state.players[targetIndex].hp;
  const hpParts: string[] = [];
  if (newHpP !== oldHpP) hpParts.push(`自己血量${oldHpP}→${newHpP}`);
  if (!isSelfTarget && newHpT !== oldHpT) hpParts.push(`对方血量${oldHpT}→${newHpT}`);
  const hpSuffix = hpParts.length > 0 ? `，${hpParts.join('，')}` : '';
  const entry: GameLogEntry = {
    turnNumber: state.turnNumber,
    message: (msgs[msgs.length - 1] || `${state.players[playerIndex].name}打出了${cardName}`) + hpSuffix,
    timestamp: Date.now(),
  };
  state.log.push(entry);

  return { gameState: state, logMessages: msgs };
}
