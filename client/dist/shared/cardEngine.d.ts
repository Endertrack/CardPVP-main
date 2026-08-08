import { GameState, PlayerState, CardDef, BuffType } from './types';
export declare function showMessage(msg: string, target?: 'all' | 'self' | 'opponent', category?: 'hint' | 'trigger'): void;
/**
 * 卡牌效果引擎 — 处理单张卡牌打出的完整流程
 */
/** 根据 icon 前缀判断卡牌属于回血类(icon3)还是攻击类(icon4)，替代旧行动卡限制 */
export declare function getCardSubtype(card: CardDef): 'heal' | 'attack' | null;
export declare function addCardToHand(player: PlayerState, card: CardDef): void;
export declare function drawCards(player: PlayerState, count: number): PlayerState;
export declare function shuffleDeck(player: PlayerState): PlayerState;
export interface ApplyCardResult {
    gameState: GameState;
    logMessages: string[];
}
export declare function heal(source: PlayerState, target: PlayerState, number: number, opponent?: PlayerState, state?: GameState): number;
export declare enum DamageType {
    Physical = 0,
    Fire = 1,
    Real = 2
}
/** 原地消耗 buff 层数（修改原对象 buffs 数组，不创建新对象） */
export declare function consumeInPlace(player: PlayerState, type: BuffType, amount: number): number;
export declare function damage(source: PlayerState, target: PlayerState, type: DamageType, base: number, isCard: boolean): number;
export declare function applyCard(gameState: GameState, playerId: string, targetId: string, card: CardDef): ApplyCardResult;
//# sourceMappingURL=cardEngine.d.ts.map