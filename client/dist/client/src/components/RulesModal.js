import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
/* ---------- 轻量 Markdown 渲染 ---------- */
function renderInline(text) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return _jsx("strong", { className: "font-semibold text-text-primary", children: part.slice(2, -2) }, i);
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return _jsx("code", { className: "bg-card-bg/60 px-1 py-0.5 rounded text-[0.85em] text-accent-shield", children: part.slice(1, -1) }, i);
        }
        return _jsx(React.Fragment, { children: part }, i);
    });
}
function SimpleMarkdown({ content }) {
    const lines = content.split('\n');
    const blocks = [];
    let i = 0;
    let key = 0;
    while (i < lines.length) {
        const line = lines[i];
        // 空行
        if (line.trim() === '') {
            i++;
            continue;
        }
        // 代码块
        if (line.trim().startsWith('```')) {
            const code = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                code.push(lines[i]);
                i++;
            }
            i++;
            blocks.push(_jsx("pre", { className: "bg-black/30 rounded-lg p-3 my-2 overflow-x-auto text-xs text-gray-300", children: _jsx("code", { children: code.join('\n') }) }, key++));
            continue;
        }
        // 表格（当前行含 | 且下一行含 --- 分隔符）
        if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
            const tableLines = [];
            while (i < lines.length && lines[i].includes('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            const rows = tableLines.map(l => l.split('|').map(c => c.trim()).filter(c => c !== ''));
            // 过滤分隔行 (|---|---|)
            const dataRows = rows.filter(r => !r.every(c => c.match(/^[-:]+$/)));
            if (dataRows.length > 0) {
                blocks.push(_jsx("div", { className: "overflow-x-auto my-2", children: _jsxs("table", { className: "w-full text-sm border-collapse", children: [_jsx("thead", { children: _jsx("tr", { children: dataRows[0].map((h, j) => (_jsx("th", { className: "border border-card-border/60 px-3 py-1.5 text-left text-text-primary bg-card-bg/30 font-semibold", children: renderInline(h) }, j))) }) }), _jsx("tbody", { children: dataRows.slice(1).map((row, ri) => (_jsx("tr", { children: row.map((cell, ci) => (_jsx("td", { className: "border border-card-border/60 px-3 py-1.5 text-text-secondary", children: renderInline(cell) }, ci))) }, ri))) })] }) }, key++));
            }
            continue;
        }
        // 标题
        const h1 = line.match(/^#\s+(.*)/);
        const h2 = line.match(/^##\s+(.*)/);
        const h3 = line.match(/^###\s+(.*)/);
        if (h1) {
            blocks.push(_jsx("h1", { className: "text-2xl font-bold text-text-primary mt-5 mb-2", children: renderInline(h1[1]) }, key++));
            i++;
            continue;
        }
        if (h2) {
            blocks.push(_jsx("h2", { className: "text-xl font-bold text-text-primary mt-4 mb-2", children: renderInline(h2[1]) }, key++));
            i++;
            continue;
        }
        if (h3) {
            blocks.push(_jsx("h3", { className: "text-base font-semibold text-text-primary mt-3 mb-1", children: renderInline(h3[1]) }, key++));
            i++;
            continue;
        }
        // 引用块
        if (line.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            blocks.push(_jsx("blockquote", { className: "border-l-4 border-accent-shield/40 pl-3 my-2 text-text-secondary text-sm", children: renderInline(quoteLines.join(' ')) }, key++));
            continue;
        }
        // 分隔线
        if (line.match(/^---+\s*$/)) {
            blocks.push(_jsx("hr", { className: "border-card-border/60 my-4" }, key++));
            i++;
            continue;
        }
        // 有序列表
        if (line.match(/^\d+\.\s/)) {
            const items = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
                items.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            blocks.push(_jsx("ol", { className: "list-decimal list-inside my-2 space-y-1 text-text-secondary text-sm pl-2", children: items.map((item, j) => _jsx("li", { children: renderInline(item) }, j)) }, key++));
            continue;
        }
        // 无序列表
        if (line.match(/^[-*]\s/)) {
            const items = [];
            while (i < lines.length && lines[i].match(/^[-*]\s/)) {
                items.push(lines[i].replace(/^[-*]\s/, ''));
                i++;
            }
            blocks.push(_jsx("ul", { className: "list-disc list-inside my-2 space-y-1 text-text-secondary text-sm pl-2", children: items.map((item, j) => _jsx("li", { children: renderInline(item) }, j)) }, key++));
            continue;
        }
        // 普通段落
        const paraLines = [];
        while (i < lines.length &&
            lines[i].trim() !== '' &&
            !lines[i].match(/^#{1,3}\s/) &&
            !lines[i].trim().startsWith('```') &&
            !lines[i].startsWith('> ') &&
            !lines[i].match(/^---+\s*$/) &&
            !lines[i].match(/^\d+\.\s/) &&
            !lines[i].match(/^[-*]\s/) &&
            !(lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('---'))) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push(_jsx("p", { className: "text-text-secondary text-sm my-1 leading-relaxed", children: renderInline(paraLines.join(' ')) }, key++));
        }
    }
    return _jsx("div", { className: "space-y-1", children: blocks });
}
/* ---------- 规则弹窗 ---------- */
export default function RulesModal({ onClose }) {
    const [content, setContent] = useState(null);
    useEffect(() => {
        // 运行时 fetch README.md，Vite dev server 会从 public 静态服务
        fetch('/README.md')
            .then(res => {
            if (!res.ok)
                throw new Error('加载失败');
            return res.text();
        })
            .then(setContent)
            .catch(() => setContent('规则文档加载失败，请检查 README.md 是否位于 public 目录。'));
    }, []);
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8", onClick: onClose, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl animate-fade-in my-8", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-text-primary", children: "\u6E38\u620F\u89C4\u5219" }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-text-secondary hover:bg-card-bg/50 transition-colors", children: "\u2715" })] }), content === null ? (_jsx("p", { className: "text-text-secondary text-center py-8", children: "\u52A0\u8F7D\u4E2D..." })) : (_jsx(SimpleMarkdown, { content: content }))] }) }));
}
//# sourceMappingURL=RulesModal.js.map