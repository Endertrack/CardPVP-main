import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CardCollectionContent } from './CardCollection';
import { BuffCollectionContent } from './BuffCollection';
export default function CollectionModal({ onClose }) {
    const [tab, setTab] = useState('cards');
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8", onClick: onClose, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl animate-fade-in my-8", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex gap-1 bg-card-bg/50 rounded-lg p-1 border border-card-border/60", children: [_jsx("button", { onClick: () => setTab('cards'), className: `px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'cards'
                                        ? 'bg-accent-shield/20 text-accent-shield'
                                        : 'text-text-secondary hover:text-text-primary'}`, children: "\uD83C\uDCCF \u5361\u724C" }), _jsx("button", { onClick: () => setTab('buffs'), className: `px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'buffs'
                                        ? 'bg-accent-shield/20 text-accent-shield'
                                        : 'text-text-secondary hover:text-text-primary'}`, children: "\u2728 \u72B6\u6001" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-text-secondary hover:bg-card-bg/50 transition-colors", children: "\u2715" })] }), tab === 'cards' ? _jsx(CardCollectionContent, {}) : _jsx(BuffCollectionContent, {})] }) }));
}
//# sourceMappingURL=CollectionModal.js.map