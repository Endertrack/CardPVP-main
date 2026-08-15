import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function DebugDrawButton({ onDebugDraw }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const handleSubmit = () => {
        const v = input.trim();
        if (!v)
            return;
        onDebugDraw(v);
        setInput('');
        setOpen(false);
    };
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setOpen(!open), className: "px-1.5 py-1.5 bg-red-100/40 border border-red-200/30 text-red-700 rounded-lg text-[10px] hover:bg-red-100/60 transition-all", title: "\u8C03\u8BD5\u6478\u724C", children: "\uD83D\uDEE0" }), open && (_jsxs("div", { className: "absolute bottom-full left-0 mb-1 bg-card-bg border border-card-border rounded-lg p-1.5 shadow-xl z-50 min-w-[140px]", children: [_jsx("p", { className: "text-[8px] text-text-secondary mb-0.5", children: "\u5361\u724C\u7F16\u53F7" }), _jsxs("div", { className: "flex gap-1", children: [_jsx("input", { type: "text", value: input, onChange: e => setInput(e.target.value), onKeyDown: e => e.key === 'Enter' && handleSubmit(), className: "flex-1 w-14 px-1.5 py-1 rounded border border-card-border bg-card-bg text-[10px] text-text-primary outline-none", placeholder: "1", autoFocus: true }), _jsx("button", { onClick: handleSubmit, className: "px-1.5 py-1 rounded bg-red-100/40 border border-red-200/30 text-red-700 text-[10px] hover:bg-red-100/60", children: "\u6478" })] })] }))] }));
}
//# sourceMappingURL=DebugDrawButton.js.map