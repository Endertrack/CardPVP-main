import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import CollectionModal from '../components/CollectionModal';
import RulesModal from '../components/RulesModal';
export default function Lobby() {
    const { createRoom, joinRoom, leaveRoom } = useSocket();
    const { connected, waitingForOpponent, player } = useGameStore();
    const [playerName, setPlayerName] = useState('');
    const [roomInput, setRoomInput] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCollection, setShowCollection] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const displayName = playerName.trim() || `玩家${Math.random().toString(36).slice(2, 6)}`;
    const handleCreate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await createRoom(displayName);
            setRoomId(result.roomId);
        }
        catch (e) {
            setError(e.message || '创建房间失败');
        }
        finally {
            setLoading(false);
        }
    };
    const handleJoin = async () => {
        if (!roomInput.trim())
            return;
        setLoading(true);
        setError(null);
        try {
            const result = await joinRoom(roomInput.trim().toUpperCase(), displayName);
            if (!result.success) {
                setError(result.error || '加入房间失败');
            }
        }
        catch (e) {
            setError(e.message || '加入房间失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 等待对手中
    if (waitingForOpponent && roomId) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center animate-fade-in", children: [_jsx("img", { src: "/assets/connect.png", alt: "", className: "w-20 h-20 mx-auto mb-6" }), _jsx("h1", { className: "text-2xl font-bold mb-2", children: "\u7B49\u5F85\u5BF9\u624B\u52A0\u5165" }), _jsxs("div", { className: "bg-card-bg border border-card-border rounded-xl p-8 mb-6 inline-block", children: [_jsx("p", { className: "text-text-secondary mb-2", children: "\u623F\u95F4\u7801" }), _jsx("p", { className: "text-4xl font-bold tracking-[0.3em] text-accent-shield", children: roomId })] }), _jsxs("div", { className: "flex justify-center gap-2", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0s' } }), _jsx("span", { className: "w-3 h-3 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0.2s' } }), _jsx("span", { className: "w-3 h-3 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0.4s' } })] }), _jsx("p", { className: "text-text-secondary mt-4 text-sm", children: "\u5C06\u6B64\u623F\u95F4\u7801\u53D1\u9001\u7ED9\u597D\u53CB\u5373\u53EF\u5BF9\u6218" }), _jsxs("p", { className: "text-text-secondary text-xs mt-2", children: ["\u73A9\u5BB6: ", displayName] }), _jsx("button", { onClick: () => {
                            leaveRoom();
                            setRoomId(null);
                            setError(null);
                        }, className: "mt-6 px-6 py-2 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50 transition-colors", children: "\u53D6\u6D88" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center p-4", children: [_jsxs("div", { className: "w-full max-w-md animate-fade-in", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("img", { src: "/assets/game.png", alt: "", className: "w-24 h-24 mx-auto mb-4" }), _jsx("h1", { className: "text-3xl font-bold text-gradient", children: "CardPVP" }), _jsx("p", { className: "text-text-secondary mt-2", children: "\u7EBF\u4E0A\u5361\u724C\u5BF9\u6218" })] }), _jsx("div", { className: "mb-6", children: _jsx("input", { type: "text", placeholder: "\u8F93\u5165\u6635\u79F0\uFF08\u53EF\u9009\uFF09", value: playerName, onChange: (e) => setPlayerName(e.target.value), className: "w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors", maxLength: 12 }) }), _jsx("button", { onClick: handleCreate, disabled: !connected || loading, className: "w-full bg-accent-shield/20 border border-accent-shield/30 text-accent-shield rounded-xl py-3 font-semibold hover:bg-accent-shield/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-4", children: loading ? '创建中...' : '创建对战房间' }), _jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "flex-1 h-px bg-card-border" }), _jsx("span", { className: "text-text-secondary text-sm", children: "\u6216" }), _jsx("div", { className: "flex-1 h-px bg-card-border" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", placeholder: "\u8F93\u5165\u623F\u95F4\u7801", value: roomInput, onChange: (e) => setRoomInput(e.target.value.toUpperCase()), onKeyDown: (e) => e.key === 'Enter' && handleJoin(), className: "flex-1 bg-card-bg border border-card-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors uppercase tracking-widest", maxLength: 4 }), _jsx("button", { onClick: handleJoin, disabled: !connected || !roomInput.trim() || loading, className: "bg-card-bg border border-card-border rounded-xl px-6 py-3 text-text-primary font-semibold hover:border-accent-heal/50 hover:text-accent-heal transition-all disabled:opacity-40 disabled:cursor-not-allowed", children: "\u52A0\u5165" })] }), error && (_jsx("div", { className: "mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center", children: error })), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { onClick: () => setShowCollection(true), className: "flex-1 py-2 rounded-xl border border-card-border text-text-secondary text-xs font-medium hover:bg-card-bg/50 transition-colors", children: "\uD83D\uDCD6 \u56FE\u9274" }), _jsx("button", { onClick: () => setShowRules(true), className: "flex-1 py-2 rounded-xl border border-card-border text-text-secondary text-xs font-medium hover:bg-card-bg/50 transition-colors", children: "\uD83D\uDCCB \u89C4\u5219" })] }), _jsx("p", { className: "text-center text-text-secondary text-xs mt-3", children: "\u65E0\u9700\u6CE8\u518C\uFF0C\u521B\u5EFA\u6216\u52A0\u5165\u623F\u95F4\u5373\u53EF\u5F00\u59CB\u5BF9\u6218" })] }), showCollection && (_jsx(CollectionModal, { onClose: () => setShowCollection(false) })), showRules && (_jsx(RulesModal, { onClose: () => setShowRules(false) }))] }));
}
//# sourceMappingURL=Lobby.js.map