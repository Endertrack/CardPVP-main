import { GameState, PlayerState, CardDef, PlayCardAction } from './types';
export declare function createGame(roomId: string, p1Id: string, p1Name: string, p2Id: string, p2Name: string): GameState;
export declare function initGame(state: GameState): GameState;
export declare function startTurn(state: GameState): GameState;
export interface PlayCardResult {
    success: boolean;
    gameState: GameState;
    error?: string;
    messages?: string[];
}
export declare function playCard(state: GameState, action: PlayCardAction, playerId: string): PlayCardResult;
export declare function endTurn(state: GameState): GameState;
export declare function handleDiscardBuffs(player: PlayerState, s?: GameState): void;
/**
 * 触发摸牌时的特殊事件（统一接口）
 * 所有"摸牌时触发的特殊效果"都在此函数内集中处理
 * 新增摸牌时触发的特殊效果请在此函数内添加
 * @param player 摸牌的玩家
 * @param card 摸到的牌
 * @param s 游戏状态（可选，用于日志记录）
 */
export declare function triggerDrawEvents(player: PlayerState, card: CardDef, s?: GameState): void;
/**
 * 触发卡牌丢弃时的特殊事件（统一接口）
 * 所有"丢弃时触发的特殊卡牌效果"都在此函数内集中处理
 * 新增特殊卡牌的丢弃事件请在此函数内添加
 * @param player 丢弃牌的玩家
 * @param card 被丢弃的卡牌
 * @param s 游戏状态（可选，用于日志记录）
 * @param target 对手玩家（可选，用于烈焰棒等需要指定目标的效果）
 */
export declare function triggerDiscardEvents(player: PlayerState, card: CardDef, s?: GameState, target?: PlayerState): void;
export declare function discardFromHand(state: GameState, playerId: string, cardId: string, targetId?: string): GameState;
export declare function getOpponentId(state: GameState, playerId: string): string;
export declare function unequipCard(state: GameState, playerId: string, slot: string): GameState;
export declare function handleGuessWeight(state: GameState, playerId: string, guessWeight: number): GameState;
export declare function handleDraftPick(state: GameState, playerId: string, cardIndex: number): GameState;
export declare function handleBucketChoice(state: GameState, playerId: string, lockType: string): GameState;
export declare function handleEquipChoice(state: GameState, playerId: string, slot: string): GameState;
export declare function cancelEquipChoice(state: GameState, playerId: string): GameState;
export declare function handleBrewConversion(state: GameState, playerId: string, cardId: string): GameState;
export declare function surrender(state: GameState, playerId: string): GameState;
//# sourceMappingURL=gameEngine.d.ts.map