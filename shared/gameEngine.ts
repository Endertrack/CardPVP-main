import { GameState, PlayerState, CardDef, GamePhase, GameLogEntry, PlayCardAction, BuffType, } from './types'; 
import { deepClone, applyEffectToPlayer, getBuffStacks, findBuff } from './buffEngine'; 
import { drawCards, shuffleDeck, applyCard, damage, DamageType, showMessage, addCardToHand } from './cardEngine'; 
import { processTurnStartBuffs, processTurnEndBuffs } from './buffEngine'; 
import { DEFAULT_MAX_HP, INITIAL_DRAW_COUNT, TURN_DRAW_COUNT, buildTestDeck, CARDS, } from './constants'; 
import { displayMessage } from '../client/src/store/notificationStore'; 

// ===== 游戏创建 ===== 
export function createGame( 
  roomId: string, 
  p1Id: string, 
  p1Name: string, 
  p2Id: string, 
  p2Name: string 
): GameState { 
  return { 
    roomId, 
    players: [ 
      { 
        id: p1Id, 
        name: p1Name, 
        hp: DEFAULT_MAX_HP, 
        maxHp: DEFAULT_MAX_HP, 
        deck: shuffleDeck({ deck: buildTestDeck(), hand: [], discardPile: [], buffs: [], equipment: {} } as any).deck, 
        hand: [], 
        discardPile: [], 
        buffs: [], 
        equipment: {}, 
        healCountThisTurn: 0, 
        attackCountThisTurn: 0, 
        actionStrategyCountThisTurn: 0, 
        handLimitBonus: 0, 
        actionLimitBonus: 0, 
        damageOnDiscardCount: 0, 
        lastPlayedCardDef: [], 
        lastPlayedCardName: '', 
        lastPlayedCardEffects: [], 
        lastPlayedCardCostType: 'action' as any, 
        causePhysicalDamage: false, 
        enchantBurstReady: true, // 修改：替换 canEnchantDiscard
        pendingGuessCardId: '', 
        pendingGuessCardWeight: 0, 
        pendingGuessCardName: '', 
        playedCardTypesThisTurn: [], 
        draftCards: [], 
        draftPlayerPick: 0, 
        draftPickCount: 0, 
        draftPickedBy: {}, 
        jungleHpUpTriggered: false, 
        pendingBucketChoice: '', 
        pendingEquipChoice: '', 
      }, 
      { 
        id: p2Id, 
        name: p2Name, 
        hp: DEFAULT_MAX_HP, 
        maxHp: DEFAULT_MAX_HP, 
        deck: shuffleDeck({ deck: buildTestDeck(), hand: [], discardPile: [], buffs: [], equipment: {} } as any).deck, 
        hand: [], 
        discardPile: [], 
        buffs: [], 
        equipment: {}, 
        healCountThisTurn: 0, 
        attackCountThisTurn: 0, 
        actionStrategyCountThisTurn: 0, 
        handLimitBonus: 0, 
        actionLimitBonus: 0, 
        damageOnDiscardCount: 0, 
        lastPlayedCardDef: [], 
        lastPlayedCardName: '', 
        lastPlayedCardEffects: [], 
        lastPlayedCardCostType: 'action' as any, 
        causePhysicalDamage: false, 
        enchantBurstReady: true, // 修改：替换 canEnchantDiscard
        pendingGuessCardId: '', 
        pendingGuessCardWeight: 0, 
        pendingGuessCardName: '', 
        playedCardTypesThisTurn: [], 
        draftCards: [], 
        draftPlayerPick: 0, 
        draftPickCount: 0, 
        draftPickedBy: {}, 
        jungleHpUpTriggered: false, 
        pendingBucketChoice: '', 
        pendingEquipChoice: '', 
      }, 
    ], 
    currentTurnIndex: 0, 
    turnNumber: 1, 
    durationTickCounter: 0, 
    phase: GamePhase.Playing, 
    log: [], 
  }; 
} 

// ===== 初始化对局（洗牌+摸牌+决定先手） ===== 
export function initGame(state: GameState): GameState { 
  const s = deepClone(state); 
  // 随机先手 
  s.currentTurnIndex = Math.random() < 0.5 ? 0 : 1; 
  // 摸初始手牌 
  for (let i = 0; i < s.players.length; i++) { 
    s.players[i] = drawCards(s.players[i], INITIAL_DRAW_COUNT); 
  } 
  //先手玩家回合摸牌 
  s.players[s.currentTurnIndex] = drawCards(s.players[s.currentTurnIndex], TURN_DRAW_COUNT); 
  return s; 
} 

// ===== 刷新装备效果 ===== 
function refreshEquipment(player: PlayerState): PlayerState { 
  const p = deepClone(player); 
  // 重置加成字段 
  p.handLimitBonus = 0; 
  p.actionLimitBonus = 0; 
  p.damageOnDiscardCount = 0; 
  // 检查场地卡加成 
  if (p.equipment.field?.name === '村庄') p.handLimitBonus = 4; 
  return p; 
} 

// ===== 开始新回合 ===== 
export function startTurn(state: GameState): GameState { 
  const s = deepClone(state); 
  s.phase = GamePhase.Playing; 
  let player = s.players[s.currentTurnIndex]; 
  // 刷新装备 
  player = refreshEquipment(player); 
  // 重置本回合状态 
  player.healCountThisTurn = 0; 
  player.attackCountThisTurn = 0; 
  player.actionStrategyCountThisTurn = 0; 
  player.jungleHpUpTriggered = false; 
  player.damageOnDiscardCount = 0; 
  player.playedCardTypesThisTurn = []; 
  player.enchantBurstReady = true; // 新增：解除获得当回合不可触发的限制
  // 回合开始 buff 已在 endTurn 完整轮变更时处理 
  // 摸牌 
  player = drawCards(player, TURN_DRAW_COUNT); 
  s.players[s.currentTurnIndex] = player; 
  return s; 
} 

// ===== 出牌 ===== 
export interface PlayCardResult { 
  success: boolean; 
  gameState: GameState; 
  error?: string; 
  messages?: string[]; 
} 

export function playCard(state: GameState, action: PlayCardAction, playerId: string): PlayCardResult { 
  // 校验游戏状态 
  if (state.phase !== GamePhase.Playing) { 
    return { success: false, gameState: state, error: '游戏未在进行中', messages: [] }; 
  } 
  // 校验是否为当前玩家 
  if (state.players[state.currentTurnIndex].id !== playerId) { 
    return { success: false, gameState: state, error: '不是你的回合', messages: [] }; 
  } 
  // 找卡牌 
  const player = state.players[state.currentTurnIndex]; 
  const card = player.hand.find(c => c.id === action.cardId); 
  if (!card) { 
    return { success: false, gameState: state, error: '卡牌不在手牌中', messages: [] }; 
  } 
  // 执行卡牌效果 
  const result = applyCard(state, playerId, action.targetId, card); 
  return { 
    success: true, 
    gameState: result.gameState, 
    messages: result.logMessages, 
  }; 
} 

// ===== 结束小回合 ===== 
export function endTurn(state: GameState): GameState { 
  let s = deepClone(state); 
  if (s.phase !== GamePhase.Playing) return s; 
  const endingIdx = s.currentTurnIndex; 
  const name = s.players[endingIdx].name; 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: `${name}行动结束`, 
    timestamp: Date.now(), 
    type: 'endTurn', 
  }); 
  // 处理回合结束 Buff：减少所有人身上由对方施加的限时buff持续-1
  // 回合定义：从自己出牌开始到对方出牌结束为1回合
  // A endTurn → 减所有人身上由B施加的buff（B的回合走完）
  // B endTurn → 减所有人身上由A施加的buff（A的回合走完）
  // 遍历所有玩家是因为对方施加的buff可能在任何人身上（包括对方施加给自己的）
  const opponentId = s.players[1 - endingIdx].id;
  for (let i = 0; i < s.players.length; i++) {
    s.players[i] = processTurnEndBuffs(s.players[i], opponentId);
  }
  // 对方回合开始 Buff（endTurn = 对方回合开始）
  const opponentIdx = 1 - endingIdx;
  s.players[opponentIdx] = processTurnStartBuffs(s.players[opponentIdx], s.players[endingIdx], opponentId);
  // 检查胜负
  for (let i = 0; i < s.players.length; i++) {
    if (s.players[i].hp <= 0) {
      s.phase = GamePhase.GameOver;
      s.winnerId = s.players.find(pl => pl.id !== s.players[i].id)?.id;
      return s;
    }
  }
  // 切换玩家 
  s.currentTurnIndex = 1 - s.currentTurnIndex; 
  // 持续时间节拍器：每两次结束出牌为完整一轮 
  s.durationTickCounter = ((s.durationTickCounter || 0) + 1) % 2; 
  if (s.durationTickCounter === 0) { 
    s.turnNumber += 1; 
    s.log.push({ 
      turnNumber: s.turnNumber, 
      message: `第${s.turnNumber}回合开始`, 
      timestamp: Date.now(), 
      type: 'endTurn', 
    }); 
  } 
  return s; 
} 

// ===== 投降 =====
export function surrender(state: GameState, playerId: string): GameState {
  const s = deepClone(state);
  if (s.phase !== GamePhase.Playing) return s;
  const idx = s.players.findIndex(p => p.id === playerId);
  if (idx === -1) return s;
  s.players[idx].hp = 0;
  s.phase = GamePhase.GameOver;
  s.winnerId = s.players[1 - idx].id;
  s.log.push({
    turnNumber: s.turnNumber,
    message: `${s.players[idx].name}投降了`,
    timestamp: Date.now(),
    type: 'endTurn',
  });
  return s;
}

export function handleDiscardBuffs(player: PlayerState, s?: GameState) {
  // 绑定诅咒：丢弃牌时受伤害 
  const curseStack = getBuffStacks(player, BuffType.DamageOnDiscard); 
  if (curseStack > 0 && player.damageOnDiscardCount < 1) { 
    damage(player, player, DamageType.Real, curseStack, false); 
    player.damageOnDiscardCount += 1; 
    showMessage(`丢弃牌时受到${curseStack}点绑定诅咒伤害`, 'self'); 
    s?.log.push({ 
      turnNumber: s.turnNumber, 
      message: `${player.name}丢弃牌时受到${curseStack}点绑定诅咒伤害`, 
      timestamp: Date.now(), 
    }); 
  } 
  // 下界荒地：丢弃牌时获得1点护盾（每回合限2次） 
  if (player.equipment?.field?.name === '下界荒地') { 
    applyEffectToPlayer(player, BuffType.Shield, 1, undefined, player.equipment.field.id, player.id); 
    s?.log.push({ 
      turnNumber: s.turnNumber, 
      message: `${player.name}丢弃牌时获得1点护盾（下界荒地）`, 
      timestamp: Date.now(), 
    }); 
  } 
} 

/**
 * 触发卡牌丢弃时的特殊事件（统一接口）
 * 所有"丢弃时触发的特殊卡牌效果"都在此函数内集中处理
 * 新增特殊卡牌的丢弃事件请在此函数内添加
 * @param player 丢弃牌的玩家
 * @param card 被丢弃的卡牌
 * @param s 游戏状态（可选，用于日志记录）
 * @param target 对手玩家（可选，用于烈焰棒等需要指定目标的效果）
 */
export function triggerDiscardEvents(player: PlayerState, card: CardDef, s?: GameState, target?: PlayerState): void {
  // 仙人掌：丢弃时触发效果，摸1张牌
  if (card.name === '仙人掌') {
    const updated = drawCards(player, 1);
    Object.assign(player, updated);
    if (s) {
      s.log.push({
        turnNumber: s.turnNumber,
        message: `${player.name}丢弃了仙人掌，触发效果摸了1张牌`,
        timestamp: Date.now(),
      });
    }
    showMessage(`${player.name}丢弃了仙人掌，触发效果摸了1张牌`, 'all');
  }

  // 烈焰棒：丢弃一张牌可造成2点火焰伤害
  if (player.equipment?.weapon?.name === '烈焰棒' && player.causePhysicalDamage && target) {
    damage(player, target, DamageType.Fire, 2, true);
    if (s) {
      s.log.push({
        turnNumber: s.turnNumber,
        message: `烈焰棒生效：${target.name}受到2点火焰伤害`,
        timestamp: Date.now(),
      });
    }
    showMessage(`烈焰棒生效：${target.name}受到2点火焰伤害`, 'all');
  }

  // 全局丢弃buff（绑定诅咒/下界荒地）
  handleDiscardBuffs(player, s);

  // ===== 未来特殊卡牌的丢弃事件请在此处添加 =====
}

// ===== 丢弃手牌 ===== 
export function discardFromHand(state: GameState, playerId: string, cardId: string, targetId?: string): GameState { 
  let s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  let player = s.players[idx]; 
  let target = s.players[1 - idx]; 
  const cardIdx = player.hand.findIndex(c => c.id === cardId); 
  if (cardIdx === -1) return s; 
  const [card] = player.hand.splice(cardIdx, 1); 

  // ===== 新增逻辑：魔咒爆发触发 ===== 
  const enchantStacks = getBuffStacks(player, BuffType.EnchantBurst); 
  if (enchantStacks > 0 && player.enchantBurstReady) { 
    // 消耗1层魔咒爆发 
    const buff = findBuff(player, BuffType.EnchantBurst); 
    if (buff) { 
      buff.stacks -= 1; 
      if (buff.stacks <= 0) { 
        player.buffs = player.buffs.filter(b => b !== buff); 
      } 
    } 

    // 确定目标：优先用传入的 targetId，否则根据卡牌默认目标决定 
    const oppId = target.id; 
    let actualTargetId = targetId; 
    if (!actualTargetId) { 
      actualTargetId = card.defaultTarget === 'self' ? player.id : oppId; 
    } 

    // 保存当前的消耗计数，因为接下来调用 applyCard 会改变它 
    const before = { 
      healCount: player.healCountThisTurn, 
      attackCount: player.attackCountThisTurn, 
      actionStrategyCount: player.actionStrategyCountThisTurn, 
      playedTypes: [...player.playedCardTypesThisTurn], 
      lastPlayedDef: [...player.lastPlayedCardDef], 
      lastPlayedName: player.lastPlayedCardName, 
    }; 

    // 执行被丢弃牌的效果 
    const result = applyCard(s, player.id, actualTargetId, card); 
    s = result.gameState; 

    // 重新获取 applyCard 更新后的 player 和 target 引用 
    const pIdx = s.players.findIndex(p => p.id === player.id); 
    player = s.players[pIdx]; 
    target = s.players[1 - pIdx]; 

    // 恢复消耗计数（因为这张牌是被丢弃触发的，不算正常打出消耗） 
    player.healCountThisTurn = before.healCount; 
    player.attackCountThisTurn = before.attackCount; 
    player.actionStrategyCountThisTurn = before.actionStrategyCount; 
    player.playedCardTypesThisTurn = before.playedTypes; 
    player.lastPlayedCardDef = before.lastPlayedDef; 
    player.lastPlayedCardName = before.lastPlayedName; 

    player.discardPile.push(card); 

    s.log.push({ 
      turnNumber: s.turnNumber, 
      message: `${player.name}触发了魔咒爆发，使${card.name}生效`, 
      timestamp: Date.now(), 
    }); 

    // 触发丢弃事件（仙人掌摸牌、烈焰棒、绑定诅咒等）
    triggerDiscardEvents(player, card, s, target); 
    s.players[idx] = player; 
    s.players[1 - idx] = target; 
    return s; // 触发魔咒爆发后直接返回，不走下面的普通丢弃逻辑 
  } 
  // =================================

  player.discardPile.push(card); 

  // 触发丢弃事件（仙人掌摸牌、烈焰棒、绑定诅咒等）
  triggerDiscardEvents(player, card, s, target); 
  s.players[idx] = player; 
  s.players[1 - idx] = target; 
  s.log.push({ turnNumber: s.turnNumber, message: `${player.name}丢弃了${card.name}`, timestamp: Date.now(), }); 
  return s; 
} 

// ===== 获取对手ID ===== 
export function getOpponentId(state: GameState, playerId: string): string { 
  return state.players.find(p => p.id !== playerId)?.id || ''; 
} 

// ===== 卸下装备 ===== 
export function unequipCard(state: GameState, playerId: string, slot: string): GameState { 
  const s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  let player = s.players[idx]; 
  const card = player.equipment[slot as keyof typeof player.equipment]; 
  if (!card) return s; 
  delete player.equipment[slot as keyof typeof player.equipment]; 
  // 装备卸下时直接丢弃（进入弃牌堆），触发丢弃事件 
  player.discardPile.push(card); 
  handleDiscardBuffs(player, s); 
  s.players[idx] = player; 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: `${player.name}卸下了${card.name}`, 
    timestamp: Date.now(), 
  }); 
  return s; 
} 

// ===== 侦测器：处理权重猜测 ===== 
export function handleGuessWeight(state: GameState, playerId: string, guessWeight: number): GameState { 
  const s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  const player = s.players[idx]; 
  if (!player.pendingGuessCardId) return s; 
  const correct = player.pendingGuessCardWeight === guessWeight; 
  const msg = correct ? `${player.name}猜中了权重(${guessWeight})！下次物理伤害×1.5` : `${player.name}猜错了权重(${guessWeight})，正确答案是${player.pendingGuessCardWeight}`; 
  if (correct) applyEffectToPlayer(player, BuffType.DamageBoost, 1, 1, 'detector', player.id); 
  player.pendingGuessCardId = ''; 
  player.pendingGuessCardWeight = 0; 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: msg, 
    timestamp: Date.now(), 
  }); 
  return s; 
} 

// ===== 附魔台：处理丢弃牌并触发 ===== (保留原函数不修改)
export function handleEnchantDiscard(state: GameState, playerId: string, cardId: string): GameState { 
  const s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  const card = s.players[idx].hand.find(c => c.id === cardId); 
  if (!card) { 
    console.log('[附魔台] 卡牌未找到:', cardId); 
    return s; 
  } 
  console.log('[附魔台] 开始处理丢弃:', card.name, '玩家:', s.players[idx].name, '对手:', s.players[1 - idx].name); 
  // 保存消耗计数，applyCard 会修改它们 
  const before = { 
    healCount: s.players[idx].healCountThisTurn, 
    attackCount: s.players[idx].attackCountThisTurn, 
    actionStrategyCount: s.players[idx].actionStrategyCountThisTurn, 
    playedTypes: [...s.players[idx].playedCardTypesThisTurn], 
    lastPlayedDef: [...s.players[idx].lastPlayedCardDef], 
    lastPlayedName: s.players[idx].lastPlayedCardName, 
  }; 
  // 将选中的牌像打出去一样生效（目标为对手） 
  const oppId = s.players[1 - idx].id; 
  console.log('[附魔台] 调用 applyCard, 目标:', oppId); 
  const result = applyCard(s, playerId, oppId, card); 
  console.log('[附魔台] applyCard 返回, messages:', result.logMessages); 
  const gs = result.gameState; 
  // 恢复消耗计数（这张牌是被丢弃触发，不是正常打出） 
  const pIdx = gs.players.findIndex(p => p.id === playerId); 
  gs.players[pIdx].healCountThisTurn = before.healCount; 
  gs.players[pIdx].attackCountThisTurn = before.attackCount; 
  gs.players[pIdx].actionStrategyCountThisTurn = before.actionStrategyCount; 
  gs.players[pIdx].playedCardTypesThisTurn = before.playedTypes; 
  gs.players[pIdx].lastPlayedCardDef = before.lastPlayedDef; 
  gs.players[pIdx].lastPlayedCardName = before.lastPlayedName; 
  // 摸2张牌（附魔自带的奖励） 
  gs.players[pIdx] = drawCards(gs.players[pIdx], 2); 
  gs.log.push({ 
    turnNumber: gs.turnNumber, 
    message: `附魔台丢弃了${card.name}并触发其效果，摸了2张牌`, 
    timestamp: Date.now(), 
  }); 
  return gs; 
} 

// ===== 运输矿车：处理选牌 ===== 
export function handleDraftPick(state: GameState, playerId: string, cardIndex: number): GameState { 
  const s = deepClone(state); 
  const pickerIdx = s.players.findIndex(p => p.id === playerId); 
  if (pickerIdx === -1) return s; 
  // 选牌数据始终在打出运输矿车的玩家身上 
  const ownerIdx = s.players.findIndex(p => p.draftCards?.length > 0); 
  if (ownerIdx === -1) return s; 
  const owner = s.players[ownerIdx]; 
  if (!owner.draftCards || owner.draftCards.length === 0) return s; 
  // 判断该轮到谁选 
  const isOwnerPick = owner.id === playerId; 
  const expectedPick = isOwnerPick ? 0 : 1; 
  if (owner.draftPlayerPick !== expectedPick) return s; 
  if (cardIndex < 0 || cardIndex >= owner.draftCards.length) return s; 
  if (owner.draftPickedBy && owner.draftPickedBy[cardIndex]) return s; 
  // 牌给当前选牌的玩家 
  const picked = owner.draftCards[cardIndex]; 
  addCardToHand(s.players[pickerIdx], picked); 
  owner.draftPickCount += 1; 
  if (!owner.draftPickedBy) owner.draftPickedBy = {}; 
  owner.draftPickedBy[cardIndex] = s.players[pickerIdx].name; 
  // 切换选牌方 
  if (owner.draftCards.length > 0 && owner.draftPickCount < 4) { 
    owner.draftPlayerPick = 1 - owner.draftPlayerPick; 
  } else { 
    owner.draftCards = []; 
    owner.draftPickedBy = {}; 
    owner.draftPlayerPick = 0; 
    owner.draftPickCount = 0; 
  } 
  s.players[ownerIdx] = owner; 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: s.players[pickerIdx].name + "选择了" + picked.name, 
    timestamp: Date.now() 
  }); 
  return s; 
} 

// ===== 蜘蛛网：处理封锁选择 ===== 
export function handleBucketChoice(state: GameState, playerId: string, lockType: string): GameState { 
  const s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  const player = s.players[idx]; 
  if (player.pendingBucketChoice !== 'pending') return s; 
  const oppIdx = 1 - idx; 
  const opponent = s.players[oppIdx]; 
  if (lockType === 'action') { 
    applyEffectToPlayer(opponent, BuffType.LockAction, 1, 1, 'bucket', player.id); 
    s.log.push({ 
      turnNumber: s.turnNumber, 
      message: `${player.name}封锁了对手的行动牌`, 
      timestamp: Date.now() 
    }); 
    showMessage(`蜘蛛网 ：行动封锁`, 'all'); 
  } else if (lockType === 'strategy') { 
    applyEffectToPlayer(opponent, BuffType.LockStrategy, 1, 1, 'bucket', player.id); 
    s.log.push({ 
      turnNumber: s.turnNumber, 
      message: `${player.name}封锁了对手的锦囊牌`, 
      timestamp: Date.now() 
    }); 
    showMessage(`蜘蛛网 ：锦囊封锁`, 'all'); 
  } 
  player.pendingBucketChoice = ''; 
  s.players[idx] = player; 
  s.players[oppIdx] = opponent; 
  return s; 
} 

// ===== 诡异钓竿：处理装备丢弃 ===== 
export function handleEquipChoice(state: GameState, playerId: string, slot: string): GameState { 
  let s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  const player = s.players[idx]; 
  if (player.pendingEquipChoice !== 'pending') return s; 
  const oppIdx = 1 - idx; 
  const opponent = s.players[oppIdx]; 
  const slotKey = slot as keyof typeof opponent.equipment; 
  const card = opponent.equipment[slotKey]; 
  if (!card) { 
    s.log.push({ 
      turnNumber: s.turnNumber, 
      message: '该槽位没有装备', 
      timestamp: Date.now() 
    }); 
    return s; 
  } 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: `诡异钓竿触发！`, 
    timestamp: Date.now() 
  }); 
  s = unequipCard(s, opponent.id, slot);
  player.pendingEquipChoice = '';
  player.pendingEquipCard = undefined; // 清除存储的卡牌
  s.players[idx] = player;
  return s;
}

// ===== 诡异钓竿：取消选择，返还卡牌 =====
export function cancelEquipChoice(state: GameState, playerId: string): GameState {
  let s = deepClone(state);
  const idx = s.players.findIndex(p => p.id === playerId);
  if (idx === -1) return s;
  const player = s.players[idx];
  if (player.pendingEquipChoice !== 'pending') return s;

  // 返还打出的卡牌到手牌（直接加入，不走 drawCards）
  if (player.pendingEquipCard) {
    const returnedCard: CardDef = {
      ...player.pendingEquipCard,
      id: `return_${player.pendingEquipCard.id}_${Date.now()}`,
    };
    addCardToHand(player, returnedCard);
    player.pendingEquipCard = undefined;
  }

  player.pendingEquipChoice = '';
  s.players[idx] = player;

  s.log.push({
    turnNumber: s.turnNumber,
    message: '诡异钓竿取消，卡牌已返还',
    timestamp: Date.now(),
  });

  return s;
} 

// ===== 酿造台：处理卡牌转化 ===== 
export function handleBrewConversion(state: GameState, playerId: string, cardId: string): GameState { 
  const s = deepClone(state); 
  const idx = s.players.findIndex(p => p.id === playerId); 
  if (idx === -1) return s; 
  const player = s.players[idx]; 
  if (player.equipment?.weapon?.name !== '酿造台') return s; 
  const cardIdx = player.hand.findIndex(c => c.id === cardId); 
  if (cardIdx === -1) return s; 
  const card = player.hand[cardIdx]; 
  let targetName: string; 
  // 原有功能：苹果 <-> 烟花 
  if (card.name === '苹果') targetName = '烟花'; 
  else if (card.name === '烟花') targetName = '苹果'; 
  // 新增功能：龙息 <-> 金苹果 
  else if (card.name === '龙息') targetName = '金苹果'; 
  else if (card.name === '金苹果') targetName = '龙息'; 
  else return s; 
  const template = CARDS.find(c => c.name === targetName); 
  if (!template) return s; 
  player.hand[cardIdx] = { ...template, id: `brew_${template.id}_${Date.now()}` }; 
  s.log.push({ 
    turnNumber: s.turnNumber, 
    message: `酿造台：将1张${card.name}转化为${targetName}`, 
    timestamp: Date.now() 
  }); 
  return s; 
}
