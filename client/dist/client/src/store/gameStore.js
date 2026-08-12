import { create } from 'zustand';
export const useGameStore = create((set, get) => ({
    connected: false,
    player: null,
    gameState: null,
    isMyTurn: false,
    waitingForOpponent: false,
    rematchState: null,
    rematchRequesterName: null,
    opponentDisconnected: false,
    page: 'lobby',
    setConnected: (connected) => set({ connected }),
    setPlayer: (player) => {
        const state = get();
        const isMyTurn = state.gameState
            ? state.gameState.players[state.gameState.currentTurnIndex]?.id === player.id
            : false;
        set({ player, isMyTurn });
    },
    setGameState: (gameState) => {
        const state = get();
        const isMyTurn = gameState
            ? gameState.players[gameState.currentTurnIndex]?.id === state.player?.id
            : false;
        set({ gameState, isMyTurn });
    },
    setWaitingForOpponent: (waiting) => set({ waitingForOpponent: waiting }),
    setRematchState: (state, requesterName) => set({
        rematchState: state,
        rematchRequesterName: requesterName !== undefined ? requesterName : null,
    }),
    setOpponentDisconnected: (status) => set({ opponentDisconnected: status }),
    setPage: (page) => set({ page }),
    // reset 不清理 page —— 由调用方显式设置页面
    reset: () => set({
        player: null,
        gameState: null,
        isMyTurn: false,
        waitingForOpponent: false,
        rematchState: null,
        rematchRequesterName: null,
        opponentDisconnected: false,
    }),
}));
//# sourceMappingURL=gameStore.js.map