import { GameState, PlayCardAction } from './types';
/**
 * 动作合法性校验
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
}
/**
 * 校验出牌动作
 */
export declare function validatePlayCard(state: GameState, playerId: string, action: PlayCardAction): ValidationResult;
/**
 * 校验结束回合
 */
export declare function validateEndTurn(state: GameState, playerId: string): ValidationResult;
//# sourceMappingURL=validation.d.ts.map