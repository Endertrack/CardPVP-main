import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { COST_TYPE_NAMES } from '@shared/types';
import { parseIcon } from '@shared/constants';
import { getCardImageUrl } from '../utils/cardImage';
const TYPE_STYLE = {
    action: 'bg-accent-attack/15 text-accent-attack',
    strategy: 'bg-accent-equip/15 text-accent-equip',
    heal: 'bg-accent-heal/15 text-accent-heal',
    attack: 'bg-accent-attack/15 text-accent-attack',
    buff: 'bg-accent-buff/15 text-accent-buff',
    debuff: 'bg-purple-100 text-purple-700',
    event: 'bg-blue-100 text-blue-700',
    equip: 'bg-accent-equip/15 text-accent-equip',
    weapon: 'bg-accent-equip/15 text-accent-equip',
    field: 'bg-accent-equip/15 text-accent-equip',
    counter: 'bg-accent-shield/15 text-accent-shield',
};
export default function SelectedCardDetail({ card }) {
    const cardTypes = parseIcon(card.icon);
    return (_jsxs("div", { className: "w-44 bg-card-bg/95 backdrop-blur-sm border border-card-border rounded-xl p-3 shadow-xl flex flex-col animate-fade-in", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("img", { src: getCardImageUrl(card.id), alt: card.name, className: "w-10 h-10 object-contain" }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-bold text-text-primary truncate", children: card.name }), _jsx("div", { className: "flex flex-wrap gap-1 mt-0.5", children: cardTypes.map((t, i) => (_jsx("span", { className: `inline-block px-1.5 py-[1px] rounded text-[9px] font-medium ${TYPE_STYLE[t] || 'bg-accent-shield/15 text-accent-shield'}`, children: COST_TYPE_NAMES[t] || '其他' }, i))) })] })] }), _jsx("div", { className: "h-px bg-card-border/60 mb-2" }), _jsx("p", { className: "text-[11px] text-text-secondary leading-relaxed", children: card.description })] }));
}
//# sourceMappingURL=SelectedCardDetail.js.map