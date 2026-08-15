import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export default function GameLog({ log }) {
    const scrollRef = useRef(null);
    useEffect(() => {
        // 使用 requestAnimationFrame 确保在浏览器下一帧渲染时执行
        // 这可以确保在面板动画打开时，DOM 高度已经正确计算
        const frameId = requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
        return () => cancelAnimationFrame(frameId);
    }, [log]); // 依赖 log，当有新日志或面板打开时触发
    return (
    // 关键修改：h-full 确保撑满父容器，overflow-y-auto 确保滚动条生效
    _jsx("div", { ref: scrollRef, className: "h-full overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent", children: log.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center", children: [_jsx("div", { className: "w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-text-secondary/30", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }), _jsx("p", { className: "text-text-secondary/40 text-sm", children: "\u6682\u65E0\u4E8B\u4EF6\u8BB0\u5F55" })] })) : (log.map((entry, i) => entry.type === 'endTurn' ? (
        // --- 高区分度设计：居中分割线 ---
        _jsxs("div", { className: "relative flex items-center justify-center py-2 animate-fade-in", children: [_jsx("div", { className: "absolute inset-0 flex items-center px-2", "aria-hidden": "true", children: _jsx("div", { className: "w-full border-t border-white/10" }) }), _jsxs("div", { className: "relative z-10 flex items-center gap-2 bg-card-bg px-3 text-[10px] font-medium uppercase tracking-widest text-text-secondary/40", children: [_jsx("span", { className: "w-1 h-1 rounded-full bg-current opacity-60" }), _jsx("span", { children: entry.message }), _jsx("span", { className: "w-1 h-1 rounded-full bg-current opacity-60" })] })] }, i)) : (
        // --- 普通日志条目 ---
        _jsxs("div", { className: "flex items-start gap-3 animate-fade-in group", children: [_jsx("div", { className: "flex-shrink-0 pt-0.5", children: _jsxs("span", { className: "inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded bg-white/5 text-[10px] font-mono font-medium text-text-secondary/70 border border-white/5", children: ["T", entry.turnNumber] }) }), _jsx("p", { className: "text-sm text-text-primary/80 leading-relaxed pt-0.5 group-hover:text-text-primary transition-colors duration-150", children: entry.message })] }, i)))) }));
}
//# sourceMappingURL=GameLog.js.map