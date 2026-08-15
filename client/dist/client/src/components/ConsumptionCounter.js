import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export default function ConsumptionCounter({ player }) {
    // 计算剩余次数
    const healRemaining = 1 - (player.healCountThisTurn || 0);
    const attackRemaining = 1 - (player.attackCountThisTurn || 0);
    const actionLimit = 5 + (player.actionLimitBonus || 0);
    const actionRemaining = actionLimit - (player.actionStrategyCountThisTurn || 0);
    const baseStyle = "flex items-center justify-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold font-mono backdrop-blur-sm shadow-sm min-h-0 overflow-hidden border";
    const isHealVisible = healRemaining > 0;
    const isAttackVisible = attackRemaining > 0;
    const isActionVisible = actionRemaining > 0;
    const badgeVariants = {
        initial: { opacity: 0, scale: 0.8, y: -10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: {
            opacity: 0,
            scale: 0.6,
            y: 20,
            transition: { duration: 0.2 }
        }
    };
    // 修复点：添加 as const
    // 这告诉 TypeScript 把 type 属性严格视为 "spring" 字面量，而不是泛泛的 string
    const springTransition = {
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1
    };
    return (_jsx("div", { className: "flex flex-col items-center justify-center gap-1.5", children: _jsxs(AnimatePresence, { mode: "popLayout", children: [isHealVisible && (_jsxs(motion.div, { layout: true, variants: badgeVariants, initial: "initial", animate: "animate", exit: "exit", transition: springTransition, className: `${baseStyle} bg-accent-heal/15 text-accent-heal border-accent-heal/30`, title: "\u5269\u4F59\u56DE\u8840\u6B21\u6570", children: [_jsx("img", { src: "/assets/icons/health.svg", alt: "Health", className: "w-3.5 h-3.5 opacity-50" }), _jsx("span", { className: "tabular-nums", children: healRemaining })] }, "heal-badge")), isAttackVisible && (_jsxs(motion.div, { layout: true, variants: badgeVariants, initial: "initial", animate: "animate", exit: "exit", transition: springTransition, className: `${baseStyle} bg-accent-attack/15 text-accent-attack border-accent-attack/30`, title: "\u5269\u4F59\u653B\u51FB\u6B21\u6570", children: [_jsx("img", { src: "/assets/icons/attack.svg", alt: "Attack", className: "w-3.5 h-3.5 opacity-50" }), _jsx("span", { className: "tabular-nums", children: attackRemaining })] }, "attack-badge")), isActionVisible && (_jsxs(motion.div, { layout: true, variants: badgeVariants, initial: "initial", animate: "animate", exit: "exit", transition: springTransition, className: `${baseStyle} bg-accent-equip/15 text-accent-equip border-accent-equip/30`, title: "\u5269\u4F59\u884C\u52A8/\u9526\u56CA\u6B21\u6570", children: [_jsxs("div", { className: "flex items-center -space-x-1", children: [_jsx("img", { src: "/assets/icons/action.svg", alt: "Action", className: "w-3 h-3 opacity-50" }), _jsx("img", { src: "/assets/icons/strategy.svg", alt: "Strategy", className: "w-3 h-3 opacity-50" })] }), _jsx("span", { className: "tabular-nums", children: actionRemaining })] }, "action-badge"))] }) }));
}
//# sourceMappingURL=ConsumptionCounter.js.map