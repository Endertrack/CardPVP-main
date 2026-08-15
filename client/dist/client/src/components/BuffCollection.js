import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { BUFF_NAMES, BuffType } from '@shared/types';
// Buff 效果描述
export const BUFF_DESCRIPTIONS = {
    [BuffType.Damage]: '获得时和回合开始时附着对象受到 n 点魔法伤害。',
    [BuffType.FireResist]: '使附着对象免疫火焰伤害。',
    [BuffType.DamageBoost]: '下次造成物理伤害时此次伤害*1.5 (向上取整)。',
    [BuffType.WitherOnDraw]: '附着对象每获得1张牌 +1 层凋零',
    [BuffType.DamageOnDiscard]: '附着对象丢弃牌时受到 n 点魔法伤害（每回合1次）。',
    [BuffType.Strength]: '使附着对象对他人造成的物理伤害增加 n 点。每层 +1 伤害。',
    [BuffType.Weakness]: '使附着对象对他人造成的物理伤害减少 n 点。每层 -1 伤害。',
    [BuffType.Resistance]: '使附着对象受到的物理伤害减少 n 点。每层 -1 受伤。',
    [BuffType.Vulnerability]: '使附着对象受到的物理伤害增加 n 点。每层 +1 受伤。',
    [BuffType.Heal]: '获得时和回合开始时回复附着对象 n 点血量。',
    [BuffType.Wither]: '回血时消耗层数并抵消回血量，每消耗1层就抵消1点回血量（最后生效）。',
    [BuffType.Shield]: '受到物理伤害时消耗层数并抵消伤害，每消耗1层就抵消1点伤害（最后生效）。',
    [BuffType.Poison]: '附着对象回血后减少 3 点血量。',
    [BuffType.FireVuln]: '使附着对象受到的火焰伤害增加 n 点。每层 +1 受伤。',
    [BuffType.HealBoost]: '使附着对象回血时额外回相当于层数的血量。',
    [BuffType.LockAction]: '附着对象无法使用行动牌。',
    [BuffType.LockStrategy]: '附着对象无法使用锦囊牌。',
    [BuffType.Horde]: '获得时和回合开始时对附着玩家造成等量物理伤害。',
    [BuffType.Blight]: '附着玩家回血时减少等量回复量。',
    [BuffType.Block]: '附着玩家下次受到物理伤害时抵消 5 点，抵挡后状态消失。',
    [BuffType.EnchantBurst]: '附着玩家丢弃手牌时消耗 1 层，使该牌对当前目标生效，获得当回合无法触发。',
};
// Buff 与 BuffType 编号映射
export const BUFF_ICON_MAP = {
    strength: 1, weakness: 2, resistance: 3, vuln: 4, heal: 5,
    wither: 6, shield: 7, fireResist: 8, poison: 9, fireVuln: 10,
    healBoost: 11, lockAction: 12, lockStrategy: 13, damage: 14,
    witherOnDraw: 15, damageBoost: 16, horde: 17, blight: 18, block: 19,
    damageOnDiscard: 20, enchantBurst: 21
};
// 忽略特殊效果类型（不显示在图鉴中）`
const SKIP_TYPES = [
    BuffType.RemoveWither, BuffType.ReduceDuration,
    BuffType.ReduceMaxHp, BuffType.IncreaseMaxHp,
    BuffType.ConditionalDiscard, BuffType.PhysicalDamage, BuffType.DrawCard,
    BuffType.StealCard, BuffType.RevealHand, BuffType.ForceDiscardEquip,
    BuffType.HealPerBuff, BuffType.HealAll,
];
/** 状态图鉴内容（不含弹窗外壳），供 CollectionModal 组合使用 */
export function BuffCollectionContent() {
    const [selected, setSelected] = useState(null);
    const buffTypes = Object.values(BuffType).filter(t => !SKIP_TYPES.includes(t));
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: buffTypes.map(type => {
                    const iconNum = BUFF_ICON_MAP[type];
                    const name = BUFF_NAMES[type] || type;
                    const desc = BUFF_DESCRIPTIONS[type] || '';
                    return (_jsxs("div", { className: `border rounded-xl p-3 cursor-pointer transition-all ${selected === type
                            ? 'border-accent-shield/40 bg-accent-shield/5'
                            : 'border-card-border/60 hover:border-card-border'}`, onClick: () => setSelected(selected === type ? null : type), children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [iconNum ? (_jsx("img", { src: `/assets/buff/buff${iconNum}.png`, alt: "", className: "w-5 h-5" })) : (_jsx("span", { className: "w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-[10px]", children: "?" })), _jsx("span", { className: "text-sm font-semibold text-text-primary", children: name })] }), selected === type && (_jsx("p", { className: "text-xs text-text-secondary leading-relaxed mt-1 pl-7", children: desc }))] }, type));
                }) }), _jsxs("p", { className: "text-center text-text-secondary text-xs mt-4", children: ["\u5171 ", buffTypes.length, " \u79CD\u6548\u679C \u00B7 \u70B9\u51FB\u5C55\u5F00\u8BE6\u60C5"] })] }));
}
export default function BuffCollection({ onClose }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8", onClick: onClose, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-xl w-full mx-4 shadow-xl animate-fade-in my-8", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-text-primary", children: "\u6548\u679C\u56FE\u9274" }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-text-secondary hover:bg-card-bg/50 transition-colors", children: "\u2715" })] }), _jsx(BuffCollectionContent, {})] }) }));
}
//# sourceMappingURL=BuffCollection.js.map