import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
export default function App() {
    const { connect, disconnect } = useSocket();
    const { connected, player, gameState, isMyTurn } = useGameStore();
    const [inGame, setInGame] = useState(false);
    useEffect(() => {
        connect();
        return () => { disconnect(); };
    }, []);
    useEffect(() => {
        if (gameState)
            setInGame(true);
        else
            setInGame(false);
    }, [gameState]);
    return (_jsxs("div", { className: "min-h-screen bg-page-bg", children: [!inGame ? (_jsx(Lobby, {})) : (_jsx(Game, {})), _jsxs("div", { className: "fixed bottom-4 right-4 flex items-center gap-2 text-xs", children: [_jsx("span", { className: `w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-text-secondary", children: connected ? '已连接' : '未连接' })] })] }));
}
//# sourceMappingURL=App.js.map