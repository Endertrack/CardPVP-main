import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BUFF_NAMES } from '@shared/types';
import { BUFF_DESCRIPTIONS, BUFF_ICON_MAP } from './BuffCollection';
// 保持清晰易读的配色方案
const BUFF_STYLES = {
    strength: 'bg-red-50 text-red-700 border-red-200',
    weakness: 'bg-purple-50 text-purple-700 border-purple-200',
    resistance: 'bg-blue-50 text-blue-700 border-blue-200',
    vuln: 'bg-amber-50 text-amber-700 border-amber-200',
    heal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    wither: 'bg-slate-50 text-slate-600 border-slate-200',
    shield: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    fireResist: 'bg-orange-50 text-orange-700 border-orange-200',
    poison: 'bg-lime-50 text-lime-700 border-lime-200',
    fireVuln: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    charge: 'bg-pink-50 text-pink-700 border-pink-200',
    fireDamage: 'bg-rose-50 text-rose-700 border-rose-200',
    lockStrategy: 'bg-sky-50 text-sky-700 border-sky-200',
    horde: 'bg-red-100 text-red-800 border-red-300',
    blight: 'bg-teal-50 text-teal-700 border-teal-200',
    block: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};
export default function BuffBadge({ buff, compactMode }) {
    const [showDetail, setShowDetail] = useState(false);
    const styleClass = BUFF_STYLES[buff.buffType] || 'bg-slate-50 text-slate-600 border-slate-200';
    const name = BUFF_NAMES[buff.buffType] || buff.buffType;
    const iconNum = BUFF_ICON_MAP[buff.buffType];
    const hasDuration = buff.remainingTurns !== undefined;
    const desc = BUFF_DESCRIPTIONS[buff.buffType] || '暂无描述';
    const showStackBadge = compactMode && buff.stacks > 1;
    const showTurnBadge = compactMode && hasDuration;
    return (_jsxs(_Fragment, { children: [_jsxs("span", { className: `
          inline-flex items-center border cursor-pointer 
          transition-all duration-200 ease-in-out
          hover:scale-105 hover:shadow-sm active:scale-95
          ${compactMode ? 'p-1 relative rounded-full' : 'px-1.5 py-0.5 rounded-full gap-1'}
          ${styleClass}
        `, onClick: (e) => {
                    e.stopPropagation();
                    setShowDetail(true);
                }, children: [iconNum ? (_jsx("img", { src: `/assets/buff/buff${iconNum}.png`, alt: name, 
                        // 普通模式图标更小 (w-3 h-3)，紧凑模式适中 (w-4 h-4)
                        className: `object-contain ${compactMode ? 'w-4 h-4' : 'w-3 h-3'}` })) : (_jsx("span", { className: `font-bold ${compactMode ? 'text-xs' : 'text-[8px]'}`, children: "\u25CF" })), !compactMode && (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-semibold text-[10px] whitespace-nowrap leading-none", children: name }), buff.stacks > 1 && (_jsxs("span", { className: "text-[9px] font-bold opacity-70 leading-none", children: ["\u00D7", buff.stacks] })), hasDuration && (_jsxs("span", { className: "text-[9px] opacity-50 leading-none", children: [buff.remainingTurns, "T"] }))] })), showStackBadge && (_jsx("span", { className: "absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white", children: buff.stacks })), showTurnBadge && (_jsx("span", { className: "absolute -bottom-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-white text-slate-700 text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm border border-slate-200", children: buff.remainingTurns }))] }), showDetail && createPortal(_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm", onClick: () => setShowDetail(false), children: _jsxs("div", { className: "bg-white rounded-xl p-4 max-w-[260px] w-full mx-4 shadow-xl border border-slate-100", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [iconNum && (_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center ${styleClass}`, children: _jsx("img", { src: `/assets/buff/buff${iconNum}.png`, alt: "", className: "w-6 h-6 object-contain" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-sm font-bold text-slate-800 truncate", children: name }), _jsxs("span", { className: "text-[11px] text-slate-400", children: ["\u5C42\u6570: ", buff.stacks] })] })] }), _jsx("p", { className: "text-xs text-slate-600 leading-relaxed mb-3", children: desc }), hasDuration && (_jsxs("p", { className: "text-[10px] text-slate-400 mb-3", children: ["\u5269\u4F59 ", buff.remainingTurns, " \u56DE\u5408"] })), _jsx("button", { onClick: () => setShowDetail(false), className: "w-full py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-medium transition-colors", children: "\u5173\u95ED" })] }) }), document.body)] }));
}
//# sourceMappingURL=BuffBadge.js.map