import { PlayerState, ActiveBuff, BuffType } from './types';
/**
 * Buff 引擎 — 纯函数，事件驱动
 */
export declare function deepClonePlayer(p: PlayerState): PlayerState;
export declare function deepClone<T>(obj: T): T;
export declare function getBuffStacks(player: PlayerState, type: BuffType, sourcePlayerId?: string): number;
export declare function findBuff(player: PlayerState, type: BuffType): ActiveBuff | undefined;
export declare function applyEffectToPlayer(player: PlayerState, buffType: BuffType, value: number, duration: number | undefined, sourceCardId: string, sourcePlayerId?: string): PlayerState | undefined;
export declare function processTurnStartBuffs(player: PlayerState, opponent: PlayerState, opponentId: string): PlayerState;
export declare function processTurnEndBuffs(player: PlayerState, opponentId: string): PlayerState;
//# sourceMappingURL=buffEngine.d.ts.map