import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { COST_TYPE_NAMES, CostType } from '@shared/types';
import { parseIcon } from '@shared/constants';
import BuffBadge from './BuffBadge';
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
/** 卡牌图鉴内容（不含弹窗外壳），供 CollectionModal 组合使用 */
export function CardCollectionContent() {
    const [cards, setCards] = useState([]);
    useEffect(() => {
        // 动态导入共享模块
        import('@shared/constants').then(mod => {
            setCards(mod.CARDS || []);
        });
    }, []);
    if (cards.length === 0) {
        return _jsx("p", { className: "text-text-secondary text-center py-8", children: "\u52A0\u8F7D\u4E2D..." });
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: cards.map(card => {
                    const cardTypes = parseIcon(card.icon);
                    const imgNum = card.id.replace('card_', '');
                    const imgExt = imgNum === '21' ? '.gif' : '.png';
                    return (_jsxs("div", { className: "bg-card-bg border border-card-border/60 rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow", children: [_jsx("img", { src: `/assets/item/${imgNum}${imgExt}`, alt: card.name, className: "w-14 h-14 object-contain" }), _jsx("span", { className: "text-sm font-semibold text-text-primary text-center", children: card.name }), _jsx("div", { className: "flex flex-wrap items-center justify-center gap-1", children: cardTypes.map((t, i) => (_jsx("span", { className: `px-2 py-0.5 rounded text-[9px] font-medium ${TYPE_BADGE[t] || 'bg-accent-shield/15 text-accent-shield'}`, children: COST_TYPE_NAMES[t] }, i))) }), _jsxs("span", { className: "text-[8px] text-text-secondary/50", children: ["\u6743\u91CD ", card.weight] }), card.buffs.length > 0 && (_jsx("div", { className: "w-full flex flex-wrap items-center justify-center gap-1", children: card.buffs.map((buff, i) => (_jsx(BuffBadge, { buff: buff, compactMode: false }, i))) })), _jsx("span", { className: "text-[9px] text-text-secondary/70 text-center leading-tight", children: card.description })] }, card.id));
                }) }), _jsxs("p", { className: "text-center text-text-secondary text-xs mt-6", children: ["\u5171 ", cards.length, " \u79CD\u5361\u724C \u00B7 \u724C\u7EC4\u6839\u636E\u6743\u91CD\u968F\u673A\u6784\u6210"] })] }));
}
export default function CardCollection({ onClose }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8", onClick: onClose, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl animate-fade-in my-8", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-text-primary", children: "\u5361\u724C\u56FE\u9274" }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-text-secondary hover:bg-card-bg/50 transition-colors", children: "\u2715" })] }), _jsx(CardCollectionContent, {})] }) }));
}
//# sourceMappingURL=CardCollection.js.map