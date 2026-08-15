import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { useIsLandscape } from '../hooks/useOrientation';
// 房间状态信息
const STATUS_INFO = {
    waiting: { text: '等待加入', dotClass: 'bg-yellow-400' },
    playing: { text: '正在对战', dotClass: 'bg-blue-400' },
    reconnecting: { text: '等待重连', dotClass: 'bg-orange-400' },
    cleaning: { text: '即将清除', dotClass: 'bg-red-400' },
};
// 房间图片
const ROOM_IMAGES = ['/assets/room/1.png', '/assets/room/2.png', '/assets/room/3.png'];
function getRoomImage(roomId) {
    const seed = parseInt(roomId, 10) || 0;
    return ROOM_IMAGES[seed % ROOM_IMAGES.length];
}
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}
const REFRESH_INTERVAL = 3; // 秒
export default function RoomList() {
    const { getRooms, createRoom, joinRoom } = useSocket();
    const { connected } = useGameStore();
    const isLandscape = useIsLandscape();
    const [searchQuery, setSearchQuery] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('room')?.toUpperCase() || '';
    });
    const [rooms, setRooms] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    // 重连校验弹窗
    const [verifyRoom, setVerifyRoom] = useState(null);
    const [verifyName, setVerifyName] = useState('');
    const displayName = playerName.trim() || `玩家${Math.random().toString(36).slice(2, 6)}`;
    // 拉取房间列表
    const fetchRooms = useCallback(async () => {
        const list = await getRooms();
        setRooms(list);
    }, [getRooms]);
    // 倒计时 + 自动刷新
    useEffect(() => {
        setCountdown(REFRESH_INTERVAL);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchRooms();
                    return REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [fetchRooms]);
    // 初次加载
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);
    // 手动刷新
    const handleRefresh = () => {
        fetchRooms();
        setCountdown(REFRESH_INTERVAL);
    };
    // 创建房间
    const handleCreate = async () => {
        if (!connected)
            return;
        setLoading(true);
        setError(null);
        try {
            await createRoom(displayName);
        }
        catch (e) {
            setError(e.message || '创建房间失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 随机加入 — 只选「等待加入」状态的房间
    const handleRandomJoin = async () => {
        if (!connected)
            return;
        const joinable = rooms.filter(r => r.status === 'waiting');
        if (joinable.length === 0) {
            setError('没有可加入的房间');
            setTimeout(() => setError(null), 3000);
            return;
        }
        const random = joinable[Math.floor(Math.random() * joinable.length)];
        await doJoin(random);
    };
    // 点击加入/重连按钮
    const handleJoin = (room) => {
        if (!connected)
            return;
        if (room.status === 'reconnecting' || room.status === 'cleaning') {
            // 重连需要弹窗校验对方昵称
            setVerifyRoom(room);
            setVerifyName('');
        }
        else {
            // 等待加入 → 直接进
            doJoin(room);
        }
    };
    // 实际调用 joinRoom
    const doJoin = async (room, verify) => {
        setLoading(true);
        setError(null);
        try {
            const result = await joinRoom(room.id, displayName, verify);
            if (!result.success) {
                setError(result.error || '加入房间失败');
            }
        }
        catch (e) {
            setError(e.message || '加入房间失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 弹窗确认重连
    const handleVerifyConfirm = async () => {
        if (!verifyRoom || !verifyName.trim())
            return;
        await doJoin(verifyRoom, verifyName.trim());
        setVerifyRoom(null);
        setVerifyName('');
    };
    // 搜索过滤
    const filteredRooms = searchQuery.trim()
        ? rooms.filter(r => r.id.includes(searchQuery.trim().toUpperCase()))
        : rooms;
    // 房间列表项渲染
    const renderRoom = (room) => {
        const info = STATUS_INFO[room.status] || STATUS_INFO.playing;
        const canJoin = room.status === 'waiting' || room.status === 'reconnecting' || room.status === 'cleaning';
        const joinLabel = room.status === 'waiting' ? '加入' : '重连';
        return (_jsxs("div", { className: "flex items-center gap-3 bg-card-bg border border-card-border rounded-2xl p-3 hover:border-accent-shield/20 transition-colors", children: [_jsx("img", { src: getRoomImage(room.id), alt: "", className: "shrink-0 w-14 h-14 rounded-xl object-cover border border-card-border/50", style: { imageRendering: 'pixelated' }, onError: (e) => { e.target.style.opacity = '0.3'; } }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-base font-bold text-text-primary tracking-wider", children: room.id }), _jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [_jsx("span", { className: `w-2 h-2 rounded-full ${info.dotClass}` }), _jsx("span", { className: "text-xs text-text-secondary", children: info.text }), _jsx("span", { className: "text-xs text-text-secondary/50 ml-2", children: formatTime(room.elapsed) })] })] }), canJoin && (_jsx("button", { onClick: () => handleJoin(room), disabled: loading, className: "shrink-0 px-5 py-2 rounded-xl bg-accent-shield/15 border border-accent-shield/25 text-accent-shield text-sm font-semibold hover:bg-accent-shield/25 transition-colors disabled:opacity-40", children: joinLabel }))] }, room.id));
    };
    // 顶部返回栏
    const TopBar = (_jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [_jsx("button", { onClick: () => useGameStore.getState().setPage('lobby'), className: "shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-card-bg border border-card-border text-text-secondary hover:text-text-primary hover:border-accent-shield/30 transition-colors", children: "\u2190" }), _jsx("h1", { className: "text-lg font-bold text-text-primary", children: "\u623F\u95F4\u5217\u8868" })] }));
    // 搜索框
    const SearchInput = (_jsx("input", { type: "text", placeholder: "\u67E5\u627E\u623F\u95F4...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value.toUpperCase()), className: "w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors uppercase tracking-widest", maxLength: 6 }));
    // 刷新按钮（带倒计时）— 横屏用
    const RefreshBtn = (_jsxs("button", { onClick: handleRefresh, className: "w-full py-2 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm hover:text-accent-shield hover:border-accent-shield/30 transition-all active:scale-95 active:bg-accent-shield/10", children: ["\u21BB \u5237\u65B0(", countdown, "s)"] }));
    // 随机加入按钮
    const RandomJoinBtn = (_jsx("button", { onClick: handleRandomJoin, disabled: !connected || loading, className: "w-full py-2.5 rounded-xl bg-accent-shield/15 border border-accent-shield/25 text-accent-shield text-sm font-semibold hover:bg-accent-shield/25 transition-colors disabled:opacity-40", children: "\uD83C\uDFB2 \u968F\u673A\u52A0\u5165" }));
    // 昵称输入
    const NameInput = (_jsx("input", { type: "text", placeholder: "\u8F93\u5165\u6635\u79F0\uFF08\u53EF\u9009\uFF09", value: playerName, onChange: (e) => setPlayerName(e.target.value), className: "w-full bg-card-bg border border-card-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors", maxLength: 12 }));
    // 创建房间按钮
    const CreateBtn = (_jsx("button", { onClick: handleCreate, disabled: !connected || loading, className: "w-full py-2.5 rounded-xl bg-accent-shield/20 border border-accent-shield/30 text-accent-shield text-sm font-semibold hover:bg-accent-shield/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed", children: loading ? '处理中...' : '创建房间' }));
    // 错误提示
    const ErrorMsg = error && (_jsx("p", { className: "text-xs text-red-400 text-center", children: error }));
    // 重连校验弹窗
    const VerifyModal = verifyRoom && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm", onClick: () => setVerifyRoom(null), children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-fade-in", onClick: e => e.stopPropagation(), children: [_jsxs("h2", { className: "text-lg font-bold text-text-primary mb-1", children: ["\u91CD\u8FDE\u623F\u95F4 ", verifyRoom.id] }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u8BF7\u8F93\u5165\u5BF9\u65B9\u6635\u79F0\u4EE5\u6821\u9A8C\u8EAB\u4EFD" }), _jsx("input", { type: "text", placeholder: "\u5BF9\u65B9\u6635\u79F0", value: verifyName, onChange: (e) => setVerifyName(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                        handleVerifyConfirm(); }, className: "w-full bg-page-bg border border-card-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors mb-4", maxLength: 12, autoFocus: true }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setVerifyRoom(null), className: "flex-1 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm font-medium hover:bg-card-bg/50 transition-colors", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleVerifyConfirm, disabled: !verifyName.trim() || loading, className: "flex-1 py-2.5 rounded-xl bg-accent-shield/20 border border-accent-shield/30 text-accent-shield text-sm font-semibold hover:bg-accent-shield/30 transition-colors disabled:opacity-40", children: loading ? '加入中...' : '确认重连' })] })] }) }));
    if (isLandscape) {
        // ===== 横屏：左侧列表 + 右侧竖直控件 =====
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-screen flex flex-col bg-page-bg", children: [_jsx("div", { className: "px-4 pt-4 pb-2 border-b border-card-border/30", children: TopBar }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsx("div", { className: "flex-1 overflow-y-auto px-4 py-3", children: filteredRooms.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-text-secondary gap-3", children: [_jsx("p", { className: "text-sm", children: searchQuery.trim() ? '未找到匹配的房间' : '暂无房间' }), !searchQuery.trim() && (_jsx("button", { onClick: handleCreate, disabled: !connected || loading, className: "text-sm font-semibold text-accent-shield hover:text-accent-shield/80 active:scale-95 transition-all disabled:opacity-40", children: "\u53BB\u521B\u5EFA\u623F\u95F4 \u2192" }))] })) : (_jsx("div", { className: "flex flex-col gap-3", children: filteredRooms.map(renderRoom) })) }), _jsxs("div", { className: "shrink-0 w-64 px-4 py-3 border-l border-card-border/30 flex flex-col gap-3 items-center overflow-y-auto", children: [RandomJoinBtn, _jsxs("div", { className: "w-full", children: [_jsx("label", { className: "text-xs text-text-secondary mb-1 block text-center", children: "\u67E5\u627E" }), SearchInput] }), RefreshBtn, _jsxs("div", { className: "w-full", children: [_jsx("label", { className: "text-xs text-text-secondary mb-1 block text-center", children: "\u6635\u79F0" }), NameInput] }), CreateBtn, ErrorMsg] })] })] }), VerifyModal] }));
    }
    // ===== 竖屏：刷新按钮在右上角，底部昵称和创建分两行 =====
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-screen flex flex-col bg-page-bg", children: [_jsxs("div", { className: "shrink-0 px-4 pt-4 pb-3 border-b border-card-border/30", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [TopBar, _jsxs("button", { onClick: handleRefresh, className: "shrink-0 px-3 py-2 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm hover:text-accent-shield hover:border-accent-shield/30 transition-all active:scale-95 active:bg-accent-shield/10", children: ["\u21BB \u5237\u65B0(", countdown, "s)"] })] }), SearchInput] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 py-3", children: filteredRooms.length === 0 ? (_jsx("div", { className: "flex flex-col items-center justify-center h-full text-text-secondary", children: _jsx("p", { className: "text-sm", children: searchQuery.trim() ? '未找到匹配的房间' : '暂无房间' }) })) : (_jsx("div", { className: "flex flex-col gap-3", children: filteredRooms.map(renderRoom) })) }), _jsxs("div", { className: "shrink-0 px-4 py-3 border-t border-card-border/30 bg-card-bg/30", children: [_jsxs("div", { className: "space-y-2", children: [NameInput, _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleCreate, disabled: !connected || loading, className: "flex-1 py-2.5 rounded-xl bg-accent-shield/20 border border-accent-shield/30 text-accent-shield text-sm font-semibold hover:bg-accent-shield/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95", children: loading ? '处理中...' : '创建房间' }), _jsx("button", { onClick: handleRandomJoin, disabled: !connected || loading, className: "flex-1 py-2.5 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm font-semibold hover:text-accent-shield hover:border-accent-shield/30 transition-colors disabled:opacity-40 active:scale-95", children: "\uD83C\uDFB2 \u968F\u673A\u52A0\u5165" })] })] }), ErrorMsg] })] }), VerifyModal] }));
}
//# sourceMappingURL=RoomList.js.map