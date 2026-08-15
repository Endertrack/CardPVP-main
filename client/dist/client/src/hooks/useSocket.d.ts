export interface RoomInfo {
    id: string;
    playerCount: number;
    activePlayerCount: number;
    playerNames: string[];
    status: 'waiting' | 'playing' | 'reconnecting' | 'cleaning';
    elapsed: number;
}
export declare function useSocket(): {
    connect: () => void;
    disconnect: () => void;
    createRoom: (playerName: string) => Promise<{
        roomId: string;
        playerId: string;
    }>;
    joinRoom: (roomId: string, playerName: string, verifyName?: string) => Promise<{
        success: boolean;
        playerId?: string;
        error?: string;
    }>;
    playCard: (cardId: string, targetId: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    endTurn: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    discardCard: (cardId: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    unequipCard: (slot: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    leaveRoom: () => void;
    getRooms: () => Promise<RoomInfo[]>;
    updateName: (name: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    guessWeight: (guess: number) => Promise<{
        success: boolean;
        error?: string;
    }>;
    draftPick: (cardIndex: number) => Promise<{
        success: boolean;
        error?: string;
    }>;
    bucketChoice: (lockType: "action" | "strategy") => Promise<{
        success: boolean;
        error?: string;
    }>;
    equipChoice: (slot: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    cancelEquipChoice: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    brewChoice: (cardId: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    blazeDiscard: (confirm: boolean) => Promise<{
        success: boolean;
        error?: string;
    }>;
    debugDrawCard: (cardId: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    rematchRequest: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    rematchAccept: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    rematchDecline: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    surrender: () => Promise<{
        success: boolean;
        error?: string;
    }>;
};
//# sourceMappingURL=useSocket.d.ts.map