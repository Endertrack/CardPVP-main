import type { GameState } from '@shared/types';
interface PlayerInfo {
    id: string;
    name: string;
    roomId: string;
}
export type RematchState = null | 'requested' | 'invited' | 'declined';
interface GameStore {
    connected: boolean;
    opponentDisconnected: boolean;
    player: PlayerInfo | null;
    gameState: GameState | null;
    isMyTurn: boolean;
    waitingForOpponent: boolean;
    rematchState: RematchState;
    rematchRequesterName: string | null;
    setConnected: (connected: boolean) => void;
    setOpponentDisconnected: (status: boolean) => void;
    setPlayer: (player: PlayerInfo) => void;
    setGameState: (state: GameState | null) => void;
    setWaitingForOpponent: (waiting: boolean) => void;
    setRematchState: (state: RematchState, requesterName?: string | null) => void;
    reset: () => void;
}
export declare const useGameStore: import("zustand").UseBoundStore<import("zustand").StoreApi<GameStore>>;
export {};
//# sourceMappingURL=gameStore.d.ts.map