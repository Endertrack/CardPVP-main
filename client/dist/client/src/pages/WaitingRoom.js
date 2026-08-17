import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { useIsLandscape } from '../hooks/useOrientation';
import { displayMessage } from '../store/notificationStore';
export default function WaitingRoom() {
    const { leaveRoom, updateName } = useSocket();
    const { player } = useGameStore();
    const isLandscape = useIsLandscape();
    const roomId = player?.roomId ?? '';
    const [nickName, setNickName] = useState(player?.name ?? '');
    const [copied, setCopied] = useState(null);
    const [nameSaving, setNameSaving] = useState(false);
    const nameTimerRef = useRef(null);
    // 兼容移动端的复制：先试 Clipboard API，失败则回退 execCommand
    const copyText = async (text) => {
        // 现代API
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            }
            catch { /* 继续回退 */ }
        }
        // 回退：隐藏 textarea + execCommand
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            ta.setAttribute('readonly', '');
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        }
        catch {
            return false;
        }
    };
    // 复制房号
    const handleCopyRoom = async () => {
        const ok = await copyText(roomId);
        if (ok) {
            setCopied('room');
            setTimeout(() => setCopied(null), 2000);
        }
        else {
            displayMessage('复制失败，请手动选中复制');
        }
    };
    // 分享链接
    const handleShareLink = async () => {
        const url = `${window.location.origin}?room=${roomId}`;
        const ok = await copyText(url);
        if (ok) {
            setCopied('link');
            setTimeout(() => setCopied(null), 2000);
        }
        else {
            displayMessage('复制失败，请手动选中复制');
        }
    };
    // 昵称修改：防抖自动保存（输入停止 800ms 后触发）
    const handleNameChange = (value) => {
        setNickName(value);
        if (nameTimerRef.current)
            clearTimeout(nameTimerRef.current);
        nameTimerRef.current = setTimeout(async () => {
            const trimmed = value.trim();
            if (!trimmed || trimmed === player?.name)
                return;
            setNameSaving(true);
            const result = await updateName(trimmed);
            setNameSaving(false);
            if (!result.success) {
                displayMessage(result.error || '昵称更新失败');
            }
        }, 800);
    };
    // 取消匹配 → 返回房间列表
    const handleCancel = () => {
        leaveRoom();
        useGameStore.getState().setPage('roomList');
    };
    // 按钮公共样式
    const btnBase = 'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]';
    // 左侧：LOGO + 房间号 + 等待文本
    const LeftBlock = (_jsxs("div", { className: "flex flex-col items-center animate-fade-in", children: [_jsx("img", { src: "/assets/connect.png", alt: "", className: "w-20 h-20 mb-5 drop-shadow-lg" }), _jsx("h1", { className: "text-2xl font-bold text-text-primary mb-4", children: "\u7B49\u5F85\u5BF9\u624B\u52A0\u5165" }), _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl px-8 py-5 mb-5", children: [_jsx("p", { className: "text-text-secondary text-xs mb-1 text-center", children: "\u623F\u95F4\u7801" }), _jsx("p", { className: "text-4xl font-bold tracking-[0.3em] text-accent-shield text-center", children: roomId })] }), _jsxs("div", { className: "flex justify-center gap-2 mb-3", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0s' } }), _jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0.2s' } }), _jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce", style: { animationDelay: '0.4s' } })] })] }));
    // 右侧：4 个按钮/输入框
    const RightBlock = (_jsxs("div", { className: `flex flex-col gap-3 ${isLandscape ? 'w-72' : 'w-full max-w-xs mx-auto'}`, children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleCopyRoom, className: `${btnBase} flex-1 bg-card-bg border border-card-border text-text-primary hover:border-accent-shield/30 hover:text-accent-shield`, children: copied === 'room' ? '✓ 已复制' : '📋 复制房号' }), _jsx("button", { onClick: handleShareLink, className: `${btnBase} flex-1 bg-card-bg border border-card-border text-text-primary hover:border-accent-shield/30 hover:text-accent-shield`, children: copied === 'link' ? '✓ 已复制' : '🔗 分享链接' })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "\u8F93\u5165\u6635\u79F0", value: nickName, onChange: (e) => handleNameChange(e.target.value), maxLength: 12, className: "w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors" }), nameSaving && (_jsx("span", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary", children: "\u4FDD\u5B58\u4E2D..." }))] }), _jsx("button", { onClick: handleCancel, className: `${btnBase} bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20`, children: "\u2715 \u53D6\u6D88\u5339\u914D" }), _jsx("p", { className: "text-center text-text-secondary text-xs mt-1", children: "\u5C06\u623F\u95F4\u7801\u6216\u94FE\u63A5\u53D1\u9001\u7ED9\u597D\u53CB\u5373\u53EF\u5BF9\u6218" })] }));
    return (_jsx("div", { className: "min-h-viewport flex items-center justify-center p-6", children: isLandscape ? (_jsxs("div", { className: "flex items-center justify-center gap-12 w-full max-w-4xl", children: [LeftBlock, RightBlock] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center gap-6 w-full", children: [LeftBlock, RightBlock] })) }));
}
//# sourceMappingURL=WaitingRoom.js.map