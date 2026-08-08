import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getCardImageUrl } from '../utils/cardImage';
export default function PlayedCardOverlay({ card, playerName, children }) {
    return (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50", children: [_jsxs("div", { className: "bg-card-bg/95 backdrop-blur-sm border-2 border-accent-equip rounded-xl p-3 shadow-2xl flex flex-col items-center gap-1 animate-card-fly-in", style: { animation: 'cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in 1.8s both' }, children: [_jsx("img", { src: getCardImageUrl(card.id), alt: card.name, className: "w-12 h-12 object-contain" }), _jsx("span", { className: "text-sm font-bold text-text-primary", children: card.name }), _jsxs("span", { className: "text-[10px] text-text-secondary", children: [playerName, " \u6253\u51FA\u4E86\u6B64\u724C"] })] }), children] }));
}
//# sourceMappingURL=PlayedCardOverlay.js.map