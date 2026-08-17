import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function CardActionPanel({ card, isMyTurn, pending, isExhausted, hasBrew, onPlayOnOpponent, onPlayOnSelf, onDiscard, onDeselect, onBrewConvert, }) {
    const exhausted = isExhausted(card);
    const [target, setTarget] = useState(card.defaultTarget === 'self' ? 'self' : 'opponent');
    const cardKey = card.id || card.uuid || card.name;
    useEffect(() => {
        setTarget(card.defaultTarget === 'self' ? 'self' : 'opponent');
    }, [cardKey]);
    const isOpponentTarget = target === 'opponent';
    const canPlay = isMyTurn && !pending && !exhausted;
    const handlePlay = () => {
        isOpponentTarget ? onPlayOnOpponent() : onPlayOnSelf();
    };
    const handleToggle = () => {
        setTarget(prev => (prev === 'opponent' ? 'self' : 'opponent'));
    };
    // 统一的按钮基础样式
    const btnBase = 'w-full px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed';
    return (_jsxs("div", { className: "w-fit bg-card-bg/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl shadow-black/40 flex flex-col gap-1.5", onClick: e => e.stopPropagation(), children: [_jsxs("button", { onClick: handleToggle, className: `${btnBase} bg-white/5 border border-white/5 hover:bg-white/10 ${isOpponentTarget ? 'text-accent-attack' : 'text-accent-heal'}`, children: [_jsx("span", { className: "opacity-80", children: "\uD83D\uDD04" }), isOpponentTarget ? '敌方' : '自己'] }), _jsx("button", { onClick: handlePlay, disabled: !canPlay, className: `${btnBase} border ${isOpponentTarget
                    ? 'bg-accent-attack/15 border-accent-attack/30 text-accent-attack hover:bg-accent-attack/25'
                    : 'bg-accent-heal/15 border-accent-heal/30 text-accent-heal hover:bg-accent-heal/25'}`, children: isOpponentTarget ? '⚔️ 使用' : '💚 使用' }), hasBrew && onBrewConvert && (_jsx("button", { onClick: onBrewConvert, disabled: pending, className: `${btnBase} bg-accent-buff/15 border border-accent-buff/30 text-accent-buff hover:bg-accent-buff/25`, children: "\uD83E\uDDEA \u8F6C\u5316" })), _jsx("button", { onClick: () => onDiscard(target), disabled: pending, className: `${btnBase} bg-white/5 border border-white/5 text-text-secondary hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30`, children: "\uD83D\uDDD1\uFE0F \u4E22\u5F03" }), _jsx("button", { onClick: onDeselect, className: `${btnBase} bg-white/5 border border-white/5 text-text-secondary hover:bg-white/10`, children: "\u2715 \u53D6\u6D88" })] }));
}
//# sourceMappingURL=CardActionPanel.js.map