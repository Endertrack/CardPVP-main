import { CostType, EffectDef, CardDef, ActiveBuff } from './types';
export declare const DEFAULT_MAX_HP = 20;
export declare const DEFAULT_HAND_LIMIT = 10;
export declare const INITIAL_DRAW_COUNT = 3;
export declare const TURN_DRAW_COUNT = 3;
export declare const MAX_STRATEGY_PER_TURN = 3;
export declare function parseIcon(iconStr: string): CostType[];
interface CardTemplate {
    id: string;
    name: string;
    icon: string;
    costType: CostType;
    effects: EffectDef[];
    buffs: ActiveBuff[];
    description: string;
    weight: number;
    defaultTarget: 'self' | 'opponent' | 'all';
}
export declare const CARDS: CardTemplate[];
export declare function buildTestDeck(): CardDef[];
export {};
//# sourceMappingURL=constants.d.ts.map