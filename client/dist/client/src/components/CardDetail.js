import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CostType, COST_TYPE_NAMES, BUFF_NAMES } from '@shared/types';
const TYPE_BADGE = {
    [CostType.Action]: 'bg-accent-attack/15 text-accent-attack',
    [CostType.Strategy]: 'bg-accent-equip/15 text-accent-equip',
    [CostType.Heal]: 'bg-accent-heal/15 text-accent-heal',
    [CostType.Attack]: 'bg-accent-attack/15 text-accent-attack',
    [CostType.Buff]: 'bg-accent-buff/15 text-accent-buff',
    [CostType.Debuff]: 'bg-purple-100 text-purple-700',
    [CostType.Equip]: 'bg-accent-equip/15 text-accent-equip',
    [CostType.Weapon]: 'bg-accent-equip/15 text-accent-equip',
    [CostType.Field]: 'bg-accent-equip/15 text-accent-equip',
    [CostType.Event]: 'bg-blue-100 text-blue-700',
    [CostType.Counter]: 'bg-cyan-100 text-cyan-700',
};
function getCardImageUrl(cardId) {
    const num = cardId.replace('card_', '').split('_')[0];
    const ext = num === '21' ? '.gif' : '.png';
    return `/assets/item/${num}${ext}`;
}
export default function CardDetail({ card, onClose }) {
    const imgUrl = getCardImageUrl(card.id);
    const badgeCls = TYPE_BADGE[card.costType] || 'bg-accent-shield/15 text-accent-shield';
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", onClick: onClose, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-xs w-full mx-4 shadow-xl animate-fade-in", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("img", { src: imgUrl, alt: card.name, className: "w-12 h-12 object-contain" }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-text-primary", children: card.name }), _jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-medium inline-block mt-0.5 ${badgeCls}`, children: COST_TYPE_NAMES[card.costType] })] })] }), _jsx("div", { className: "h-px bg-card-border mb-4" }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-semibold text-text-secondary uppercase tracking-wider", children: "\u6548\u679C" }), card.effects.map((eff, i) => (_jsxs("div", { className: "flex items-start gap-2 text-sm", children: [_jsx("span", { className: "text-text-primary mt-0.5", children: "\u2022" }), _jsxs("div", { children: [_jsx("span", { className: "text-text-primary font-medium", children: BUFF_NAMES[eff.buffType] || eff.buffType }), _jsxs("span", { className: "text-text-secondary", children: [" ", eff.value > 0 ? eff.value : ''] }), eff.duration ? (_jsxs("span", { className: "text-text-secondary text-xs", children: ["\uFF08\u6301\u7EED", eff.duration, "\u56DE\u5408\uFF09"] })) : ''] })] }, i)))] }), _jsx("div", { className: "mt-4 p-3 bg-card-bg/50 border border-card-border/50 rounded-xl", children: _jsx("p", { className: "text-xs text-text-secondary", children: card.description }) }), _jsx("button", { onClick: onClose, className: "w-full mt-4 py-2 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50 transition-colors", children: "\u5173\u95ED" })] }) }));
}
//# sourceMappingURL=CardDetail.js.map