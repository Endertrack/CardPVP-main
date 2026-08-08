import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BUFF_NAMES } from '@shared/types';
import { getCardImageUrl } from '../utils/cardImage';
const SLOT_NAMES = {
    equip: '装备',
    weapon: '武器',
    field: '场地'
};
const Icon = ({ name, className }) => {
    const srcMap = {
        equip: '/assets/icons/equip.svg',
        weapon: '/assets/icons/weapon.svg',
        field: '/assets/icons/field.svg'
    };
    return (_jsx("img", { src: srcMap[name], alt: name, className: className || 'w-4 h-4' }));
};
export default function EquipmentDisplay({ equipment, isOpponent, onUnequip }) {
    const [detailCard, setDetailCard] = useState(null);
    const slots = ['equip', 'weapon', 'field'].map(slot => ({
        slot,
        card: equipment[slot],
    }));
    // 修复：将 slot 参数类型限制为具体的联合类型，解决索引签名错误
    const handleCardClick = (slot) => {
        return (e) => {
            e.stopPropagation();
            setDetailCard({ card: equipment[slot], slot });
        };
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center justify-center gap-2 h-20", children: slots.map(({ slot, card }) => (_jsx("div", { className: `relative w-16 h-full rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 group cursor-pointer ${card
                        ? 'bg-card-bg/80 border border-accent-shield/30 shadow-md hover:scale-105 hover:border-accent-shield/60'
                        : 'bg-gray-100/20 border border-dashed border-gray-300 text-gray-600'}`, onClick: card ? handleCardClick(slot) : undefined, children: card ? (_jsxs(_Fragment, { children: [_jsx("img", { src: getCardImageUrl(card.id), alt: card.name, className: "w-11 h-11 object-contain drop-shadow-sm transition-transform group-hover:scale-110" }), _jsx("span", { className: "text-[9px] text-text-primary font-medium leading-tight text-center px-1 truncate w-full", children: card.name })] })) : (_jsxs("span", { className: "flex flex-col items-center gap-1 opacity-70", children: [_jsx(Icon, { name: slot, className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] tracking-wider", children: SLOT_NAMES[slot] })] })) }, slot))) }), detailCard && (_jsx("div", { className: "fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4", onClick: () => setDetailCard(null), children: _jsxs("div", { className: "bg-card-bg/95 backdrop-blur-md border border-white/10 rounded-2xl p-5 max-w-xs w-full shadow-2xl", onClick: e => {
                        e.stopPropagation();
                        e.preventDefault();
                    }, children: [_jsxs("div", { className: "flex items-start gap-4 mb-4", children: [_jsx("div", { className: "w-16 h-16 rounded-xl bg-black/20 flex items-center justify-center shrink-0 border border-white/5", children: _jsx("img", { src: getCardImageUrl(detailCard.card.id), alt: detailCard.card.name, className: "w-12 h-12 object-contain" }) }), _jsxs("div", { className: "flex-1 pt-1", children: [_jsx("h3", { className: "text-lg font-bold text-text-primary", children: detailCard.card.name }), _jsxs("span", { className: "inline-flex items-center gap-1 mt-1 text-[11px] text-accent-shield bg-accent-shield/10 px-2 py-0.5 rounded-full font-medium", children: [_jsx(Icon, { name: detailCard.slot, className: "w-3 h-3" }), SLOT_NAMES[detailCard.slot] || '其他'] })] })] }), _jsx("p", { className: "text-sm text-text-secondary leading-relaxed mb-4 bg-black/10 p-3 rounded-lg border border-white/5", children: detailCard.card.description }), detailCard.card.effects.length > 0 && (_jsxs("div", { className: "space-y-2 mb-5", children: [_jsx("div", { className: "text-[11px] text-text-secondary/70 uppercase tracking-wider font-semibold", children: "\u5361\u724C\u6548\u679C" }), detailCard.card.effects.map((eff, i) => (_jsxs("div", { className: "flex items-center gap-2 text-sm text-text-primary bg-white/5 px-3 py-2 rounded-lg border border-white/5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-accent-shield shrink-0" }), _jsx("span", { className: "font-medium", children: BUFF_NAMES[eff.buffType] || eff.buffType }), eff.value > 0 && (_jsxs("span", { className: "text-accent-shield font-bold ml-1", children: ["+", eff.value] })), eff.duration && (_jsxs("span", { className: "text-text-secondary/70 ml-auto text-[11px]", children: [eff.duration, " \u56DE\u5408"] }))] }, i)))] })), _jsxs("div", { className: "flex gap-2", children: [!isOpponent && onUnequip && (_jsx("button", { onClick: () => {
                                        onUnequip(detailCard.slot);
                                        setDetailCard(null);
                                    }, className: "flex-1 py-3 rounded-xl border border-accent-attack/30 text-accent-attack text-sm font-medium hover:bg-accent-attack/10 transition-colors", children: "\u5378\u4E0B" })), _jsx("button", { onClick: () => setDetailCard(null), className: `py-3 rounded-xl text-sm font-medium transition-colors bg-white/5 text-text-secondary hover:bg-white/10 ${!isOpponent && onUnequip ? 'flex-1' : 'w-full'}`, children: "\u5173\u95ED" })] })] }) }))] }));
}
//# sourceMappingURL=EquipmentDisplay.js.map