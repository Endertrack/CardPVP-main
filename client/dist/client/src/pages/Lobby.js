import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useIsLandscape } from '../hooks/useOrientation';
import CollectionModal from '../components/CollectionModal';
import RulesModal from '../components/RulesModal';
export default function Lobby() {
    const { connected } = useGameStore();
    const isLandscape = useIsLandscape();
    const [showCollection, setShowCollection] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const handleStart = () => {
        useGameStore.getState().setPage('roomList');
    };
    // 按钮公共样式
    const btnBase = 'w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';
    // 左侧 Logo + 文本
    const LogoBlock = (_jsxs("div", { className: "flex flex-col items-center animate-fade-in", children: [_jsx("img", { src: "/assets/game.png", alt: "", className: "w-28 h-28 mb-4 drop-shadow-lg" }), _jsx("h1", { className: "text-4xl font-bold text-gradient", children: "CardPVP" }), _jsx("p", { className: "text-text-secondary mt-2 text-lg", children: "\u7EBF\u4E0A\u5361\u724C\u5BF9\u6218" })] }));
    // 右侧 3 个按钮
    const ButtonBlock = (_jsxs("div", { className: `flex flex-col gap-4 ${isLandscape ? 'w-72' : 'w-full max-w-xs mx-auto'}`, children: [_jsx("button", { onClick: handleStart, disabled: !connected, className: `${btnBase} bg-accent-shield/20 border-2 border-accent-shield/40 text-accent-shield hover:bg-accent-shield/30 hover:border-accent-shield/60 shadow-lg shadow-accent-shield/10`, children: "\u2694\uFE0F \u5F00\u59CB" }), _jsx("button", { onClick: () => setShowRules(true), className: `${btnBase} bg-card-bg border-2 border-card-border text-text-primary hover:border-accent-shield/30 hover:bg-card-bg/80`, children: "\uD83D\uDCCB \u89C4\u5219" }), _jsx("button", { onClick: () => setShowCollection(true), className: `${btnBase} bg-card-bg border-2 border-card-border text-text-primary hover:border-accent-shield/30 hover:bg-card-bg/80`, children: "\uD83D\uDCD6 \u56FE\u9274" })] }));
    return (_jsxs("div", { className: "min-h-viewport flex items-center justify-center p-6", children: [isLandscape ? (_jsxs("div", { className: "flex items-center justify-center gap-16 w-full max-w-3xl", children: [LogoBlock, ButtonBlock] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center gap-10 w-full", children: [LogoBlock, ButtonBlock] })), showCollection && (_jsx(CollectionModal, { onClose: () => setShowCollection(false) })), showRules && (_jsx(RulesModal, { onClose: () => setShowRules(false) }))] }));
}
//# sourceMappingURL=Lobby.js.map