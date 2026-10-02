// shared/roleEngine.ts
// 角色技能触发引擎：6 角色全部技能实装 + 简洁 toast / 详细战斗记录双通道
//
// 触发约定（已与需求方确认）：
// - "回合开始时"均指自己回合开始；同一玩家同回合开始的技能提示合并进同一条战斗记录
// - 同一时间多个事件（回合开始）时，所有角色技能在状态与装备结算完之后生效；游戏开始时先手玩家优先
// - 条件型技能未满足时在战斗记录中记录原因（每回合限次类除外，如悦灵「回收」）
// - [*n] 表示持续 n 回合；时机中存在多个条件时需同时满足

import { GameState, PlayerState, BuffType, ContentSegment, CardDef, GamePhase } from './types';
import { showTrigger, heal, damage, DamageType, applyCard, drawCards } from './cardEngine';
import { deepClone, getBuffStacks, applyEffectToPlayer } from './buffEngine';
import { appendLog, findOpponent } from './gameEngine';
import { CARDS } from './constants';

// ===== 角色 id =====
const ROLE = {
  ZOMBIE: 1,    // 僵尸
  SHULKER: 2,   // 潜影贝
  WITCH: 3,     // 女巫
  VILLAGER: 4,  // 村民
  ALLAY: 5,     // 悦灵
  VEX: 6,       // 恼鬼
} as const;

const MAX_HP_CAP = 20; // 潜影贝「禁锢」：血量上限封顶

/** 状态数（同迷之炖菜算法：去重状态种类数） */
function statusKinds(player: PlayerState): number {
  return new Set(player.buffs.map(b => b.buffType)).size;
}

/** 玩家段（战斗记录/toast 通用） */
function playerSeg(player: PlayerState): ContentSegment {
  return { type: 'player', playerId: player.id, bold: true };
}

/** 从手牌获得一张指定名称的卡（游戏开始时技能用，直接入手牌） */
function grantCard(player: PlayerState, cardName: string): boolean {
  const def = CARDS.find(c => c.name === cardName);
  if (!def) return false;
  player.hand.push({ ...def, id: `${def.id}_${player.id}_role` });
  return true;
}

// ===== 游戏开始：女巫「酿造」、恼鬼「狂暴」（先手玩家优先触发） =====
export function onGameStart(s: GameState): void {
  // currentTurnIndex 为先手；按先手→后手顺序触发
  const order = [s.players[s.currentTurnIndex], s.players[1 - s.currentTurnIndex]];
  for (const player of order) {
    const roleId = player.roleId ?? 1;
    if (roleId === ROLE.ALLAY) {
      // 精灵固有属性：血量上限初始为15（抵消涵盖所有增减 → 恒为15）
      player.maxHp = 15;
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (roleId === ROLE.WITCH) {
      const ok = grantCard(player, '红石粉');
      if (ok) {
        appendLog(s, [
          playerSeg(player),
          { type: 'text', text: ' 「酿造」触发：游戏开始，获得1张红石粉（加入手牌）' },
        ]);
        showTrigger([
          playerSeg(player),
          { type: 'text', text: ' 酿造→获得红石粉' },
        ], 'all');
      }
    }
    if (roleId === ROLE.VEX) {
      const ok = grantCard(player, '烟花');
      if (ok) {
        appendLog(s, [
          playerSeg(player),
          { type: 'text', text: ' 「狂暴」触发：游戏开始，获得1张烟花（加入手牌）' },
        ]);
        showTrigger([
          playerSeg(player),
          { type: 'text', text: ' 狂暴→获得烟花' },
        ], 'all');
      }
    }
  }
}

// ===== 回合开始（当前行动玩家；在状态/装备结算与摸牌之后调用） =====
// 同一玩家的技能提示合并进同一条战斗记录（G2）；toast 逐技能简洁（G3）
export function onTurnStart(s: GameState, player: PlayerState): void {
  const roleId = player.roleId ?? 1;
  const logSegs: ContentSegment[] = [playerSeg(player)];

  // 悦灵「回收」的每回合限次标记：自己回合开始时刷新
  player.allyRecallUsed = false;

  if (roleId === ROLE.ZOMBIE) {
    // 增援：回合开始时，血量≤12 → 获得1层力量[*1]
    if (player.hp <= 12) {
      applyEffectToPlayer(player, BuffType.Strength, 1, 1, 'role_skill', s, player.id);
      logSegs.push(
        { type: 'text', text: ` 「增援」触发：血量为${player.hp}（≤12），获得` },
        { type: 'buff', buffType: BuffType.Strength },
        { type: 'text', text: '×1' },
      );
      showTrigger([
        playerSeg(player),
        { type: 'text', text: ' 增援→' },
        { type: 'buff', buffType: BuffType.Strength },
        { type: 'text', text: '+1' },
      ], 'all');
    } else {
      logSegs.push({ type: 'text', text: ` 「增援」：血量为${player.hp}（＞12），未触发` });
    }

    // 异变：回合开始时，血量为奇数 → 获得1层抗性[*1]
    if (player.hp % 2 === 1) {
      applyEffectToPlayer(player, BuffType.Resistance, 1, 1, 'role_skill', s, player.id);
      logSegs.push(
        { type: 'text', text: ` 「异变」触发：血量为${player.hp}（奇数），获得` },
        { type: 'buff', buffType: BuffType.Resistance },
        { type: 'text', text: '×1' },
      );
      showTrigger([
        playerSeg(player),
        { type: 'text', text: ' 异变→' },
        { type: 'buff', buffType: BuffType.Resistance },
        { type: 'text', text: '+1' },
      ], 'all');
    } else {
      logSegs.push({ type: 'text', text: ` 「异变」：血量为${player.hp}（偶数），未触发` });
    }

    // 亡灵：回合开始时 → 获得1层凋零（无 [*n]，直到被清除）
    applyEffectToPlayer(player, BuffType.Wither, 1, undefined, 'role_skill', s, player.id);
    logSegs.push(
      { type: 'text', text: ' 「亡灵」触发：获得' },
      { type: 'buff', buffType: BuffType.Wither },
      { type: 'text', text: '×1' },
    );
    showTrigger([
      playerSeg(player),
      { type: 'text', text: ' 亡灵→' },
      { type: 'buff', buffType: BuffType.Wither },
      { type: 'text', text: '+1' },
    ], 'all');
  }

  if (roleId === ROLE.WITCH) {
    const kinds = statusKinds(player);
    // 诅咒：回合开始时，状态数＜4 → 获得1层虚弱[*1]
    if (kinds < 4) {
      applyEffectToPlayer(player, BuffType.Weakness, 1, 1, 'role_skill', s, player.id);
      logSegs.push(
        { type: 'text', text: ` 「诅咒」触发：状态数为${kinds}（＜4），获得` },
        { type: 'buff', buffType: BuffType.Weakness },
        { type: 'text', text: '×1' },
      );
      showTrigger([
        playerSeg(player),
        { type: 'text', text: ' 诅咒→' },
        { type: 'buff', buffType: BuffType.Weakness },
        { type: 'text', text: '+1' },
      ], 'all');
    } else {
      logSegs.push({ type: 'text', text: ` 「诅咒」：状态数为${kinds}（≥4），未触发` });
    }

    // 药理：回合开始时，状态数≥8 → 获得1层力量[*1]
    if (kinds >= 8) {
      applyEffectToPlayer(player, BuffType.Strength, 1, 1, 'role_skill', s, player.id);
      logSegs.push(
        { type: 'text', text: ` 「药理」触发：状态数为${kinds}（≥8），获得` },
        { type: 'buff', buffType: BuffType.Strength },
        { type: 'text', text: '×1' },
      );
      showTrigger([
        playerSeg(player),
        { type: 'text', text: ' 药理→' },
        { type: 'buff', buffType: BuffType.Strength },
        { type: 'text', text: '+1' },
      ], 'all');
    } else {
      logSegs.push({ type: 'text', text: ` 「药理」：状态数为${kinds}（＜8），未触发` });
    }
  }

  if (roleId === ROLE.ALLAY) {
    // 自愈：回合开始时 → 回1点血
    const opp = findOpponent(s, player.id);
    heal(player, player, 1, s, opp);
    logSegs.push({ type: 'text', text: ' 「自愈」触发：回复1点血量' });
    showTrigger([
      playerSeg(player),
      { type: 'text', text: ' 自愈→回复1点血量' },
    ], 'all');
  }

  appendLog(s, logSegs);
}

// ===== 凋零被清除（潜影贝「防御」）：在 heal 消耗清空点 / RemoveWither 清空点调用 =====
export function onWitherCleared(s: GameState, target: PlayerState): void {
  if ((target.roleId ?? 1) !== ROLE.SHULKER) return;
  const opp = findOpponent(s, target.id);
  applyEffectToPlayer(target, BuffType.Shield, 1, undefined, 'role_skill', s, target.id, opp);
  appendLog(s, [
    playerSeg(target),
    { type: 'text', text: ' 「防御」触发：凋零被清除，获得' },
    { type: 'buff', buffType: BuffType.Shield },
    { type: 'text', text: '×1' },
  ]);
  showTrigger([
    playerSeg(target),
    { type: 'text', text: ' 防御→' },
    { type: 'buff', buffType: BuffType.Shield },
    { type: 'text', text: '+1' },
  ], 'all');
}

// ===== 回血时（潜影贝「隐匿」）：拥有护盾时回血量+1；无护盾时记录未触发 =====
// 由 cardEngine.heal 在凋零消耗结算之后调用，返回加成值
export function getHealBonus(s: GameState, target: PlayerState): number {
  if ((target.roleId ?? 1) !== ROLE.SHULKER) return 0;
  if (getBuffStacks(target, BuffType.Shield) > 0) {
    appendLog(s, [
      playerSeg(target),
      { type: 'text', text: ' 「隐匿」触发：拥有护盾，此次回血量+1' },
    ]);
    return 1;
  }
  appendLog(s, [
    playerSeg(target),
    { type: 'text', text: ' 「隐匿」：回血时无护盾，未触发' },
  ]);
  return 0;
}

// ===== 潜影贝「禁锢」固有属性：血量上限最高为20（超出时修正并提示） =====
export function clampMaxHp(s: GameState, target: PlayerState): void {
  if ((target.roleId ?? 1) !== ROLE.SHULKER) return;
  if (target.maxHp > MAX_HP_CAP) {
    target.maxHp = MAX_HP_CAP;
    target.hp = Math.min(target.hp, target.maxHp);
    appendLog(s, [
      playerSeg(target),
      { type: 'text', text: ` 「禁锢」：血量上限最高为20，已修正至${MAX_HP_CAP}` },
    ]);
    showTrigger([
      playerSeg(target),
      { type: 'text', text: ' 禁锢→上限修正至20' },
    ], 'all');
  }
}

// ===== 潜影贝「禁锢」固有属性：卡牌上限-1 =====
export function getHandLimitAdjust(player: PlayerState): number {
  return (player.roleId ?? 1) === ROLE.SHULKER ? -1 : 0;
}

// ===== 悦灵「精灵」固有属性：生命上限即将增减时抵消 =====
// 返回 true 表示已被抵消，调用方跳过本次 maxHp 变更
export function tryAbsorbMaxHpChange(s: GameState, target: PlayerState, delta: number): boolean {
  if ((target.roleId ?? 1) !== ROLE.ALLAY) return false;
  if (delta === 0) return false;
  const opp = findOpponent(s, target.id);
  if (delta < 0) {
    // 抵消减少，然后失去随机1张手牌
    if (target.hand.length > 0) {
      const idx = Math.floor(Math.random() * target.hand.length);
      const [lost] = target.hand.splice(idx, 1);
      target.discardPile.push(lost);
      appendLog(s, [
        playerSeg(target),
        { type: 'text', text: ' 「精灵」触发：抵消生命上限减少，失去随机1张手牌' },
      ]);
      showTrigger([
        playerSeg(target),
        { type: 'text', text: ' 精灵→抵消上限减少，失去1张手牌' },
      ], 'all');
    } else {
      appendLog(s, [
        playerSeg(target),
        { type: 'text', text: ' 「精灵」触发：抵消生命上限减少（手牌为空，无牌可失）' },
      ]);
      showTrigger([
        playerSeg(target),
        { type: 'text', text: ' 精灵→抵消上限减少' },
      ], 'all');
    }
  } else {
    // 抵消增加，然后摸1张牌
    drawCards(target, 1, s, opp);
    appendLog(s, [
      playerSeg(target),
      { type: 'text', text: ' 「精灵」触发：抵消生命上限增加，摸1张牌' },
    ]);
    showTrigger([
      playerSeg(target),
      { type: 'text', text: ' 精灵→抵消上限增加，摸1张牌' },
    ], 'all');
  }
  return true;
}

// ===== 恼鬼「突袭」：丢弃的牌照常生效，代价消耗1次回血牌次数 =====
// 调用方：discardFromHand 在魔咒爆发判定失败后调用；返回 true 表示已突袭（牌不入弃牌堆）
// 实现与 triggerEnchantBurst 同款递归模式：注入 live 引用，结果原地回写
export function tryRaid(s: GameState, player: PlayerState, card: CardDef, opponent?: PlayerState, targetId?: string): boolean {
  if ((player.roleId ?? 1) !== ROLE.VEX) return false;
  // 时机：没有魔咒爆发状态时（身上无魔咒爆发层数且无可用层数）
  if (getBuffStacks(player, BuffType.EnchantBurst) > 0 || (player.enchantBurstReady || 0) > 0) return false;
  // 时机：有剩余出牌次数时（仅出牌阶段）
  if (s.phase !== GamePhase.Playing || s.players[s.currentTurnIndex]?.id !== player.id) return false;
  const actionLimit = 5 + (player.actionLimitBonus || 0);
  const actionRemaining = actionLimit - (player.actionStrategyCountThisTurn || 0);
  if (actionRemaining <= 0) return false;

  const playerIdx = s.players.findIndex(pl => pl.id === player.id);
  if (playerIdx === -1) return false;
  const oppSlot = s.players[1 - playerIdx];

  // 消耗1次出牌次数
  player.actionStrategyCountThisTurn = (player.actionStrategyCountThisTurn || 0) + 1;

  // 确定目标：主动丢弃透传的 targetId 优先，否则按卡牌默认目标
  const actualTargetId = targetId
    ?? (card.defaultTarget === 'self' ? player.id : (opponent?.id ?? oppSlot.id));

  // 快照 applyCard 会改动的计数/状态（突袭消耗的回血次数保留，不恢复）
  const before = {
    healCount: player.healCountThisTurn,
    attackCount: player.attackCountThisTurn,
    actionStrategyCount: player.actionStrategyCountThisTurn,
    playedTypes: [...player.playedCardTypesThisTurn],
    lastPlayedDef: [...player.lastPlayedCardDef],
    lastPlayedSelfTarget: [...(player.lastPlayedCardSelfTarget || [])],
    lastPlayedName: player.lastPlayedCardName,
    lastPlayedEffects: [...player.lastPlayedCardEffects],
    lastPlayedCostType: player.lastPlayedCardCostType,
    causePhysicalFen: player.causePhysicalDamageFen,
    causePhysicalBang: player.causePhysicalDamageBang,
    blazePowder: player.blazePowderUsedThisTurn,
  };

  appendLog(s, [
    playerSeg(player),
    { type: 'text', text: ` 「突袭」触发：消耗1次出牌次数，「${card.name}」生效` },
  ]);
  showTrigger([
    playerSeg(player),
    { type: 'text', text: ` 突袭→${card.name}生效` },
  ], 'all');

  // 玻璃板递归模式：注入 live 引用后克隆结算，结果原地回写
  const newState = deepClone(s);
  newState.players[playerIdx] = player;
  if (opponent) newState.players[1 - playerIdx] = opponent;
  const result = applyCard(newState, player.id, actualTargetId, card);

  // 丢弃触发不算正常打出：恢复消耗计数与"上一张牌"状态（保留突袭消耗的出牌次数）
  const np = result.gameState.players[playerIdx];
  np.healCountThisTurn = before.healCount;
  np.attackCountThisTurn = before.attackCount;
  np.actionStrategyCountThisTurn = (before.actionStrategyCount || 0) + 1;
  np.playedCardTypesThisTurn = before.playedTypes;
  np.lastPlayedCardDef = before.lastPlayedDef;
  np.lastPlayedCardSelfTarget = before.lastPlayedSelfTarget;
  np.lastPlayedCardName = before.lastPlayedName;
  np.lastPlayedCardEffects = before.lastPlayedEffects;
  np.lastPlayedCardCostType = before.lastPlayedCostType;
  np.causePhysicalDamageFen = before.causePhysicalFen;
  np.causePhysicalDamageBang = before.causePhysicalBang;
  np.blazePowderUsedThisTurn = before.blazePowder;

  Object.assign(player, np);
  Object.assign(opponent ?? oppSlot, result.gameState.players[1 - playerIdx]);
  Object.assign(s, result.gameState);
  s.players[playerIdx] = player;
  s.players[1 - playerIdx] = opponent ?? oppSlot;

  return true;
}

// ===== 丢弃事件中的角色技能（统一入口，由 triggerDiscardEvents 调用） =====
// 覆盖：村民「交易」「自私」、悦灵「回收」（对方丢弃时截获）
// 返回 stolen：卡被悦灵回收截获，调用方不再将其置入丢弃者弃牌堆
export function onDiscard(s: GameState, discarder: PlayerState, card: CardDef, targetId?: string): RoleDiscardResult {
  const result: RoleDiscardResult = {};
  const opp = findOpponent(s, discarder.id);
  const roleId = discarder.roleId ?? 1;
  const inOwnPlayPhase =
    s.phase === GamePhase.Playing && s.players[s.currentTurnIndex]?.id === discarder.id;

  // —— 村民「交易」：丢弃卡牌时，有剩余出牌次数时 → 消耗1次出牌次数，摸1张牌，获得1层护盾 ——
  if (roleId === ROLE.VILLAGER) {
    if (inOwnPlayPhase) {
      const limit = 5 + (discarder.actionLimitBonus || 0);
      const remaining = limit - (discarder.actionStrategyCountThisTurn || 0);
      if (remaining > 0) {
        discarder.actionStrategyCountThisTurn = (discarder.actionStrategyCountThisTurn || 0) + 1;
        drawCards(discarder, 1, s, opp);
        applyEffectToPlayer(discarder, BuffType.Shield, 1, undefined, 'role_skill', s, discarder.id, opp);
        appendLog(s, [
          playerSeg(discarder),
          { type: 'text', text: ` 「交易」触发：丢弃「${card.name}」，消耗1次出牌次数，摸1张牌，获得` },
          { type: 'buff', buffType: BuffType.Shield },
          { type: 'text', text: '×1' },
        ]);
        showTrigger([
          playerSeg(discarder),
          { type: 'text', text: ' 交易→' },
          { type: 'buff', buffType: BuffType.Shield },
          { type: 'text', text: '+1' },
        ], 'all');
      } else {
        appendLog(s, [
          playerSeg(discarder),
          { type: 'text', text: ` 「交易」：丢弃「${card.name}」，无剩余出牌次数，未触发` },
        ]);
      }
    } else {
      appendLog(s, [
        playerSeg(discarder),
        { type: 'text', text: ` 「交易」：丢弃「${card.name}」，不在出牌阶段，未触发` },
      ]);
    }

    // —— 村民「自私」：爆牌时，每爆1张牌受到2点魔法伤害 ——
    // （爆牌丢弃统一经过 discardFromHand，此处不区分来源；只在爆牌流程中由调用方传入爆牌标记）
  }

  // —— 对方悦灵「回收」：对方丢弃卡牌时，本回合未触发此技能 → 获得该卡牌 ——
  if ((opp.roleId ?? 1) === ROLE.ALLAY && !opp.allyRecallUsed) {
    opp.allyRecallUsed = true;
    opp.hand.push(card);
    result.stolen = true;
    appendLog(s, [
      playerSeg(opp),
      { type: 'text', text: ` 「回收」触发：获得${discarder.name}丢弃的「${card.name}」（加入手牌，本回合限1次）` },
    ]);
    showTrigger([
      playerSeg(opp),
      { type: 'text', text: ' 回收→获得' },
      { type: 'text', text: `「${card.name}」` },
    ], 'all');
  }

  return result;
}

export interface RoleDiscardResult {
  /** 卡被悦灵「回收」截获：不进丢弃者弃牌堆 */
  stolen?: boolean;
  /** 卡被恼鬼「突袭」生效：不进弃牌堆 */
  raided?: boolean;
}

// ===== 村民「自私」：爆牌时每张牌受到2点魔法伤害（由 handleHandLimit 爆牌流程逐张调用） =====
export function onBurnCard(s: GameState, player: PlayerState, card: CardDef): void {
  if ((player.roleId ?? 1) !== ROLE.VILLAGER) return;
  damage(player, player, DamageType.Physical, 2, s);
  appendLog(s, [
    playerSeg(player),
    { type: 'text', text: ` 「自私」触发：爆牌「${card.name}」，受到2点魔法伤害` },
  ]);
  showTrigger([
    playerSeg(player),
    { type: 'text', text: ' 自私→受到2点魔法伤害' },
  ], 'all');
}
