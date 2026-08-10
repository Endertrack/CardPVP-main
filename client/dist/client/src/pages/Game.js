import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { GamePhase, CostType, COST_TYPE_NAMES } from '@shared/types';
import PlayerInfo from '../components/PlayerInfo';
import PlayerHand from '../components/PlayerHand';
import ActionBar from '../components/ActionBar';
import NotificationToast from '../components/NotificationToast';
import { displayMessage } from '../store/notificationStore';
import { getCardImageUrl } from '../utils/cardImage';
import SelectedCardDetail from '../components/SelectedCardDetail';
import CardActionPanel from '../components/CardActionPanel';
import ConsumptionCounter from '../components/ConsumptionCounter';
import EquipmentDisplay from '../components/EquipmentDisplay';
import PlayedCardOverlay from '../components/PlayedCardOverlay';
import TriggerEffectPanel from '../components/TriggerEffectPanel';
import DebugDrawButton from '../components/DebugDrawButton';
import GameLogPanel from '../components/GameLogPanel';
import BuffBadge from '../components/BuffBadge';
import CollectionModal from '../components/CollectionModal';
import RulesModal from '../components/RulesModal';
import { useSettingsStore } from '../store/settingsStore';
export default function Game() {
    const { playCard, endTurn, discardCard, unequipCard, disconnect, guessWeight, draftPick, bucketChoice, equipChoice, cancelEquipChoice, brewChoice, blazeDiscard, debugDrawCard, rematchRequest, rematchAccept, rematchDecline, surrender } = useSocket();
    const { gameState, player, isMyTurn, rematchState, rematchRequesterName, opponentDisconnected } = useGameStore();
    const cardOverlayDuration = useSettingsStore((s) => s.cardOverlayDuration);
    const [selectedCard, setSelectedCard] = useState(null);
    const [pending, setPending] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showGameLog, setShowGameLog] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showCollection, setShowCollection] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [handCollapsed, setHandCollapsed] = useState(false);
    const [recentPlayedCard, setRecentPlayedCard] = useState(null);
    const playedCardTimer = useRef();
    const playedCardKey = useRef(0);
    // 交互弹窗状态
    const [showGuessDialog, setShowGuessDialog] = useState(false);
    const [guessInput, setGuessInput] = useState('');
    const [showEnchantDialog, setShowEnchantDialog] = useState(false);
    const [enchantableCards, setEnchantableCards] = useState([]);
    const [showDraftDialog, setShowDraftDialog] = useState(false);
    const [draftCardsList, setDraftCardsList] = useState([]);
    const [showBucketDialog, setShowBucketDialog] = useState(false);
    const [showEquipDialog, setShowEquipDialog] = useState(false);
    // Ref 守卫——确保弹窗只触发一次
    const shownGuess = useRef(false);
    const shownEnchant = useRef(false);
    const shownDraft = useRef(false);
    const shownBucket = useRef(false);
    const shownEquip = useRef(false);
    const shownEnchantReady = useRef(false);
    const me = gameState?.players.find(p => p.id === player?.id);
    const opponent = gameState?.players.find(p => p.id !== player?.id);
    // 检测需要显示的交互弹窗
    useEffect(() => {
        if (!me)
            return;
        // 状态清空时重置 ref（避免下次无法弹窗）
        if (!me.pendingGuessCardId)
            shownGuess.current = false;
        if (!opponent?.pendingBucketChoice)
            shownBucket.current = false;
        if (!me.draftCards?.length)
            shownDraft.current = false;
        // 侦测器：有待猜的牌
        if (me.pendingGuessCardId && !shownGuess.current) {
            shownGuess.current = true;
            setShowGuessDialog(true);
            setGuessInput('');
        }
        // 附魔台：日志中有"附魔台触发"提示时
        const lastLog = gameState?.log?.[gameState.log.length - 1]?.message || '';
        if (lastLog.includes('附魔台触发') && isMyTurn && !shownEnchant.current) {
            const checkTypes = [CostType.Heal, CostType.Attack, CostType.Buff, CostType.Debuff];
            const played = me.playedCardTypesThisTurn || [];
            const missingType = checkTypes.find(ct => !played.includes(ct));
            if (missingType && me.hand) {
                // 通过 icon 前缀匹配类型（costType 已不再区分回血/攻击/增益/减益/事件）
                const iconPrefixForType = {
                    [CostType.Heal]: 3,
                    [CostType.Attack]: 4,
                    [CostType.Buff]: 5,
                    [CostType.Debuff]: 6,
                    [CostType.Event]: 7,
                };
                const validCards = me.hand.filter(c => {
                    if (c.costType === missingType)
                        return true;
                    const prefix = iconPrefixForType[missingType];
                    if (prefix) {
                        const parts = c.icon.split(',').map(Number);
                        return parts.slice(0, -1).includes(prefix);
                    }
                    return false;
                });
                if (validCards.length > 0) {
                    shownEnchant.current = true;
                    setEnchantableCards(validCards);
                    setShowEnchantDialog(true);
                }
            }
        }
        if (!lastLog.includes('请丢弃一张'))
            shownEnchant.current = false;
        // 运输矿车：有待选牌
        if (me.draftCards && me.draftCards.length > 0 && !shownDraft.current) {
            shownDraft.current = true;
            setDraftCardsList(me.draftCards);
            setShowDraftDialog(true);
        }
        // 运输矿车：选牌结束（draftCards 清空时关闭弹窗）
        if ((!me.draftCards || me.draftCards.length === 0) && showDraftDialog) {
            setShowDraftDialog(false);
            setDraftCardsList([]);
        }
        // 蜘蛛网：选择封锁类型
        if (me?.pendingBucketChoice === 'pending' && !shownBucket.current) {
            shownBucket.current = true;
            setShowBucketDialog(true);
        }
        if (!me?.pendingBucketChoice)
            shownBucket.current = false;
        // 诡异钓竿：选择装备
        if (me?.pendingEquipChoice === 'pending' && !shownEquip.current) {
            shownEquip.current = true;
            setShowEquipDialog(true);
        }
        if (!me?.pendingEquipChoice)
            shownEquip.current = false;
        // 运输矿车：有 draftCards 时重置 ref 让弹窗可以重新显示
        if (me.draftCards && me.draftCards.length > 0 && shownDraft.current && !showDraftDialog) {
            shownDraft.current = false;
        }
        // 附魔台：满足条件时 toast 提示（已弃置）
        const checkTypes = [CostType.Heal, CostType.Attack, CostType.Buff, CostType.Debuff, CostType.Event];
        const played = me.playedCardTypesThisTurn || [];
        const matchedCount = checkTypes.filter(ct => played.includes(ct)).length;
        const hasEnchantInHand = me.hand.some(c => c.name === '附魔台');
    }, [me, opponent, gameState, isMyTurn, showDraftDialog]);
    // 显示提示（3秒自动消失）
    const showToast = useCallback((msg) => {
        displayMessage(msg);
    }, []);
    // 游戏结束处理
    useEffect(() => {
        if (gameState?.phase === GamePhase.GameOver) {
            const timer = setTimeout(() => setShowResult(true), 600);
            return () => clearTimeout(timer);
        }
        else {
            setShowResult(false);
        }
    }, [gameState?.phase]);
    // 取消选中
    const doDeselect = useCallback(() => {
        setSelectedCard(null);
    }, []);
    const toggleHand = useCallback(() => {
        setHandCollapsed(prev => {
            if (prev) {
                // 展开时不清除选中
            }
            else {
                setSelectedCard(null); // 收起时取消选中
            }
            return !prev;
        });
    }, []);
    // 点击空白取消选中
    const handleAreaClick = useCallback(() => {
        setSelectedCard(null);
    }, []);
    // 回合开始时自动展开手牌
    const prevTurnRef = useRef(isMyTurn);
    useEffect(() => {
        if (isMyTurn && !prevTurnRef.current) {
            setHandCollapsed(false); // 回合开始自动展开手牌
        }
        prevTurnRef.current = isMyTurn;
    }, [isMyTurn]);
    // 出牌动画（双方打出都显示）
    const prevPlayedLenRef = useRef({ me: 0, opp: 0, myDiscard: 0, oppDiscard: 0 });
    useEffect(() => {
        const myLen = me?.lastPlayedCardDef?.length ?? 0;
        const oppLen = opponent?.lastPlayedCardDef?.length ?? 0;
        const myDiscardLen = me?.lastDiscardedCardDef?.length ?? 0;
        const oppDiscardLen = opponent?.lastDiscardedCardDef?.length ?? 0;
        const prev = prevPlayedLenRef.current;
        let newCard = null;
        if (myLen > prev.me && me?.lastPlayedCardDef?.length) {
            const latest = me.lastPlayedCardDef[myLen - 1];
            const selfTarget = me.lastPlayedCardSelfTarget?.[myLen - 1] ?? false;
            if (latest?.name)
                newCard = { card: latest, playerName: me.name, variant: selfTarget ? 'self' : 'opponent' };
        }
        else if (oppLen > prev.opp && opponent?.lastPlayedCardDef?.length) {
            const latest = opponent.lastPlayedCardDef[oppLen - 1];
            const selfTarget = opponent.lastPlayedCardSelfTarget?.[oppLen - 1] ?? false;
            if (latest?.name)
                newCard = { card: latest, playerName: opponent.name, variant: selfTarget ? 'self' : 'opponent' };
        }
        else if (myDiscardLen > prev.myDiscard && me?.lastDiscardedCardDef?.length) {
            const latest = me.lastDiscardedCardDef[myDiscardLen - 1];
            if (latest?.name)
                newCard = { card: latest, playerName: me.name, variant: 'discard' };
        }
        else if (oppDiscardLen > prev.oppDiscard && opponent?.lastDiscardedCardDef?.length) {
            const latest = opponent.lastDiscardedCardDef[oppDiscardLen - 1];
            if (latest?.name)
                newCard = { card: latest, playerName: opponent.name, variant: 'discard' };
        }
        if (newCard) {
            playedCardKey.current += 1;
            setRecentPlayedCard({ ...newCard, key: playedCardKey.current });
            if (playedCardTimer.current)
                clearTimeout(playedCardTimer.current);
            playedCardTimer.current = setTimeout(() => setRecentPlayedCard(null), cardOverlayDuration);
        }
        // 游戏重置时长度归零，同步重置 ref
        prevPlayedLenRef.current = { me: myLen, opp: oppLen, myDiscard: myDiscardLen, oppDiscard: oppDiscardLen };
    }, [me?.lastPlayedCardDef?.length, opponent?.lastPlayedCardDef?.length, me?.lastDiscardedCardDef?.length, opponent?.lastDiscardedCardDef?.length]);
    // 选牌
    const handleSelectCard = useCallback((card) => {
        if (!isMyTurn || pending || !gameState || !opponent)
            return;
        setSelectedCard(prev => prev?.id === card.id ? null : card);
    }, [isMyTurn, pending, gameState, opponent]);
    // 出牌
    const handlePlayCard = useCallback(async (targetId) => {
        if (!selectedCard || !isMyTurn || pending)
            return;
        setPending(true);
        const res = await playCard(selectedCard.id, targetId);
        if (!res.success && res.error)
            showToast(res.error);
        setSelectedCard(null);
        setPending(false);
    }, [selectedCard, isMyTurn, playCard, pending, showToast]);
    // 丢弃
    const handleDiscard = useCallback(async () => {
        if (!selectedCard || pending)
            return;
        setPending(true);
        const res = await discardCard(selectedCard.id);
        if (!res.success && res.error)
            showToast(res.error);
        setSelectedCard(null);
        setPending(false);
    }, [selectedCard, discardCard, pending, showToast]);
    // 结束回合
    const handleEndTurn = useCallback(async () => {
        if (!isMyTurn || pending)
            return;
        setPending(true);
        const res = await endTurn();
        if (!res.success && res.error)
            showToast(res.error);
        setSelectedCard(null);
        setPending(false);
    }, [isMyTurn, endTurn, pending, showToast]);
    // 蜘蛛网
    const handleBucketLock = useCallback(async (lockType) => {
        setShowBucketDialog(false);
        setPending(true);
        await bucketChoice(lockType);
        setPending(false);
    }, [bucketChoice]);
    // 酿造台转化
    const handleBrewConvert = useCallback(async () => {
        if (!selectedCard)
            return;
        setPending(true);
        await brewChoice(selectedCard.id);
        setSelectedCard(null);
        setPending(false);
    }, [selectedCard, brewChoice]);
    const handleEquipSelect = useCallback(async (slot) => {
        setShowEquipDialog(false);
        setPending(true);
        await equipChoice(slot);
        setPending(false);
    }, [equipChoice]);
    // 诡异钓竿：取消选择，返还卡牌
    const handleEquipCancel = useCallback(async () => {
        setShowEquipDialog(false);
        setPending(true);
        await cancelEquipChoice();
        setPending(false);
    }, [cancelEquipChoice]);
    // 回大厅
    const handleBackToLobby = useCallback(() => {
        disconnect();
        window.location.reload();
    }, [disconnect]);
    // 再战
    const [rematchPending, setRematchPending] = useState(false);
    const handleRematchRequest = useCallback(async () => {
        setRematchPending(true);
        const res = await rematchRequest();
        setRematchPending(false);
        if (res.success) {
            useGameStore.getState().setRematchState('requested');
        }
        else {
            showToast(res.error || '请求失败');
        }
    }, [rematchRequest, showToast]);
    const handleRematchAccept = useCallback(async () => {
        await rematchAccept();
    }, [rematchAccept]);
    const handleRematchDecline = useCallback(async () => {
        await rematchDecline();
    }, [rematchDecline]);
    // 侦测器
    const handleGuessSubmit = useCallback(async () => {
        const guess = parseInt(guessInput);
        if (isNaN(guess) || guess < 0) {
            showToast('请输入有效数字');
            return;
        }
        setShowGuessDialog(false);
        setPending(true);
        await guessWeight(guess);
        setPending(false);
        setGuessInput('');
    }, [guessInput, guessWeight, showToast]);
    // 附魔台选牌
    const handleEnchantSelect = useCallback(async (cardId) => {
        setShowEnchantDialog(false);
        setEnchantableCards([]);
        setPending(true);
        await discardCard(cardId);
        setPending(false);
    }, [discardCard]);
    // 运输矿车
    const handleDraftSelect = useCallback(async (index) => {
        setShowDraftDialog(false);
        setDraftCardsList([]);
        setPending(true);
        await draftPick(index);
        setPending(false);
    }, [draftPick]);
    if (!gameState || !me || !opponent) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-page-bg", children: _jsx("span", { className: "text-text-secondary/60", children: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    const iWin = gameState.winnerId === player?.id;
    function isCardExhausted(card) {
        if (!me)
            return true;
        if (card.costType === CostType.Action || card.costType === CostType.Strategy) {
            const poolLimit = 5 + (me.actionLimitBonus || 0);
            if ((me.actionStrategyCountThisTurn || 0) >= poolLimit)
                return true;
        }
        return false;
    }
    const hasBrew = !!(selectedCard && (selectedCard.name === '苹果' || selectedCard.name === '烟花' || selectedCard.name === '金苹果' || selectedCard.name === '龙息') &&
        me?.equipment?.weapon?.name === '酿造台');
    return (_jsxs("div", { className: "h-screen flex flex-col bg-page-bg overflow-hidden", onClick: handleAreaClick, children: [_jsx(NotificationToast, {}), opponentDisconnected && (_jsxs("div", { className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none", children: [_jsx("div", { className: "text-5xl mb-4 animate-bounce", children: "\u26A0\uFE0F" }), _jsx("div", { className: "text-2xl font-bold mb-2", children: "\u5BF9\u624B\u5DF2\u65AD\u5F00\u8FDE\u63A5" }), _jsx("div", { className: "text-sm opacity-80", children: "\u7B49\u5F85\u5BF9\u65B9\u91CD\u8FDE\u4E2D..." })] })), _jsxs("div", { className: "flex items-center justify-between h-12 shrink-0 px-4 border-b border-card-border/30 bg-page-dark/20", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(PlayerInfo, { player: opponent, isOpponent: true }), _jsx("span", { className: "text-xs", children: "\uD83C\uDCCF" }), _jsx("span", { className: "text-xs font-semibold text-text-primary tabular-nums", children: opponent.hand.length })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setShowGameLog(true), className: "text-[10px] text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded border border-card-border/30", children: "\uD83D\uDCCB \u8BB0\u5F55" }), _jsx("button", { onClick: () => setShowOptions(true), className: "text-[10px] text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded border border-card-border/30", children: "\u2699\uFE0F \u9009\u9879" })] })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center gap-2 overflow-hidden p-2", onClick: e => e.stopPropagation(), children: [_jsx(EquipmentDisplay, { equipment: opponent.equipment, isOpponent: true }), _jsx("div", { className: "flex items-center gap-1 flex-wrap", children: opponent.buffs.map((buff, i) => _jsx(BuffBadge, { buff: buff, compactMode: opponent.buffs.length > 4 }, `${buff.buffType}-${i}`)) }), recentPlayedCard ? (_jsx(PlayedCardOverlay, { card: recentPlayedCard.card, playerName: recentPlayedCard.playerName, variant: recentPlayedCard.variant, children: _jsx(TriggerEffectPanel, {}) }, recentPlayedCard.key)) : (_jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20", children: _jsx(TriggerEffectPanel, {}) }))] }), _jsxs("div", { className: "flex items-center justify-center gap-4 h-14 shrink-0 border-y border-card-border/20 bg-page-dark/10 px-4", onClick: e => e.stopPropagation(), children: [_jsx(ActionBar, { isMyTurn: isMyTurn, onEndTurn: handleEndTurn, pending: pending }), isMyTurn && _jsx(DebugDrawButton, { onDebugDraw: debugDrawCard }), isMyTurn && _jsx(ConsumptionCounter, { player: me })] }), _jsxs("div", { className: `flex-1 flex flex-col items-center justify-center gap-2 overflow-hidden p-2 relative ${handCollapsed ? 'z-40' : 'z-10'}`, onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "flex items-center gap-1 flex-wrap", children: me.buffs.map((buff, i) => _jsx(BuffBadge, { buff: buff, compactMode: me.buffs.length > 4 }, `${buff.buffType}-${i}`)) }), _jsx(EquipmentDisplay, { equipment: me.equipment, onUnequip: unequipCard })] }), _jsxs("div", { className: "shrink-0 relative z-30", onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "absolute bottom-full left-0 right-0", children: _jsx(PlayerHand, { cards: me.hand, disabled: !isMyTurn || pending, selectedCardId: selectedCard?.id ?? null, onSelectCard: handleSelectCard, collapsed: handCollapsed, onToggle: toggleHand }) }), _jsx("div", { className: "flex items-center justify-between py-2 px-3 bg-page-bg/95 backdrop-blur-sm border-t border-card-border/20", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(PlayerInfo, { player: me }), _jsxs("button", { onClick: (e) => { e.stopPropagation(); toggleHand(); }, className: `group relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all duration-300 shadow-sm
          ${me.hand.length >= 7
                                        ? (handCollapsed
                                            ? 'bg-red-100/80 border-red-300/60 text-accent-attack hover:bg-red-200/80'
                                            : 'bg-red-50/60 border-red-300/40 text-accent-attack')
                                        : handCollapsed
                                            ? 'bg-gradient-to-br from-accent-shield/15 to-accent-shield/5 border-accent-shield/40 text-accent-shield hover:from-accent-shield/25 hover:to-accent-shield/10 hover:border-accent-shield/60'
                                            : 'bg-card-bg/70 border-card-border/50 text-text-primary hover:bg-card-bg hover:border-card-border'}`, title: handCollapsed ? '展开手牌' : '收起手牌', children: [_jsx("span", { className: "text-sm leading-none", children: "\uD83C\uDCCF" }), _jsx("span", { className: "text-xs font-bold tabular-nums", children: me.hand.length }), _jsx("svg", { className: `w-3 h-3 transition-transform duration-300 ${handCollapsed ? 'rotate-180' : ''}`, viewBox: "0 0 12 12", fill: "none", children: _jsx("path", { d: "M2.5 4.5L6 8L9.5 4.5", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) })] })] }) })] }), selectedCard && (_jsx("div", { className: "fixed right-2 top-12 z-40", onClick: e => e.stopPropagation(), children: _jsx(SelectedCardDetail, { card: selectedCard }) })), selectedCard && isMyTurn && (_jsx("div", { className: "fixed right-2 top-1/2 -translate-y-1/2 z-40", onClick: e => e.stopPropagation(), children: _jsx("div", { className: "animate-fade-in", children: _jsx(CardActionPanel, { card: selectedCard, isMyTurn: isMyTurn, pending: pending, isExhausted: isCardExhausted, hasBrew: hasBrew, onPlayOnOpponent: () => handlePlayCard(opponent.id), onPlayOnSelf: () => handlePlayCard(me.id), onDiscard: handleDiscard, onDeselect: doDeselect, onBrewConvert: handleBrewConvert }) }) })), selectedCard && isCardExhausted(selectedCard) && (_jsx("div", { className: "fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none", children: _jsx("div", { className: "bg-white border border-accent-equip/30 rounded-xl px-5 py-3 shadow-lg text-sm text-accent-equip font-medium", children: "\u26A0\uFE0F \u672C\u56DE\u5408\u884C\u52A8/\u9526\u56CA\u6B21\u6570\u5DF2\u7528\u5B8C" }) })), showGameLog && _jsx(GameLogPanel, { log: gameState.log, onClose: () => setShowGameLog(false) }), showResult && gameState?.phase === GamePhase.GameOver && (_jsx("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in", onClick: handleAreaClick, children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("div", { className: "text-5xl mb-4", children: iWin ? '🎉' : '😢' }), _jsx("h2", { className: "text-xl font-bold text-text-primary mb-2", children: iWin ? '恭喜获胜！' : '战败' }), _jsx("p", { className: "text-text-secondary text-sm mb-6", children: iWin ? `你击败了 ${opponent.name}！` : `${opponent.name} 击败了你` }), _jsxs("div", { className: "flex gap-2", children: [rematchState === 'requested' ? (_jsx("button", { disabled: true, className: "flex-1 py-2.5 rounded-xl bg-accent-equip/15 border border-accent-equip/25 text-accent-equip font-semibold text-sm opacity-60 cursor-not-allowed", children: "\u23F3 \u7B49\u5F85\u5BF9\u65B9\u63A5\u53D7..." })) : (_jsxs("button", { onClick: handleRematchRequest, disabled: rematchPending, className: "flex-1 py-2.5 rounded-xl bg-accent-equip/15 border border-accent-equip/25 text-accent-equip font-semibold text-sm hover:bg-accent-equip/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [rematchPending ? '⏳' : '⚔️', " \u518D\u6218"] })), _jsx("button", { onClick: handleBackToLobby, className: "flex-1 py-2.5 rounded-xl bg-accent-shield/15 border border-accent-shield/25 text-accent-shield font-semibold text-sm hover:bg-accent-shield/25 transition-colors", children: "\u8FD4\u56DE\u5927\u5385" })] }), rematchState === 'declined' && (_jsx("p", { className: "text-xs text-accent-attack/70 mt-3 animate-fade-in", children: "\u5BF9\u65B9\u62D2\u7EDD\u4E86\u518D\u6218\u8BF7\u6C42" }))] }) })), showGuessDialog && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", onClick: () => setShowGuessDialog(false), children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\uD83D\uDD0D \u4FA6\u6D4B\u5668" }), me?.pendingGuessCardName && _jsx("p", { className: "text-sm text-accent-attack font-semibold mb-1", children: "\u968F\u673A\u9009\u62E9\u4E86\u4E00\u5F20\u5361\u724C" }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u731C\u6D4B\u8FD9\u5F20\u724C\u5728\u724C\u7EC4\u4E2D\u7684\u6743\u91CD\uFF1A" }), _jsx("input", { type: "number", value: guessInput, onChange: e => setGuessInput(e.target.value), onKeyDown: e => e.key === 'Enter' && handleGuessSubmit(), className: "w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 text-text-primary text-center text-lg font-bold outline-none focus:border-accent-shield/50 mb-4", placeholder: "\u8F93\u5165\u6570\u5B57", autoFocus: true, min: 0, max: 50 }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleGuessSubmit, className: "flex-1 py-2.5 rounded-xl bg-accent-shield/15 border border-accent-shield/25 text-accent-shield font-semibold text-sm hover:bg-accent-shield/25", children: "\u2705 \u786E\u8BA4" }), _jsx("button", { onClick: () => setShowGuessDialog(false), className: "flex-1 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50", children: "\u2715 \u53D6\u6D88" })] })] }) })), showEnchantDialog && enchantableCards.length > 0 && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", onClick: () => setShowEnchantDialog(false), children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\u2697\uFE0F \u9644\u9B54\u53F0" }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u9009\u62E9\u4E00\u5F20\u724C\u4E22\u5F03\u5E76\u89E6\u53D1\u5176\u6548\u679C\uFF1A" }), _jsx("div", { className: "space-y-2", children: enchantableCards.map(card => {
                                return (_jsxs("button", { onClick: () => handleEnchantSelect(card.id), className: "w-full flex items-center gap-3 p-3 rounded-xl border border-card-border hover:border-accent-shield/40 transition-colors hover:bg-card-bg/50 text-left", children: [_jsx("img", { src: getCardImageUrl(card.id), alt: "", className: "w-8 h-8 object-contain" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-semibold text-text-primary", children: card.name }), _jsx("span", { className: "text-xs text-text-secondary ml-2", children: COST_TYPE_NAMES[card.costType] })] })] }, card.id));
                            }) }), _jsx("button", { onClick: () => setShowEnchantDialog(false), className: "w-full mt-4 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50", children: "\u53D6\u6D88" })] }) })), showBucketDialog && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-xs w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\uD83E\uDEA3 \u8718\u86DB\u7F51" }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u9009\u62E9\u8981\u5C01\u9501\u7684\u7C7B\u578B\uFF1A" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => handleBucketLock('action'), className: "flex-1 py-3 rounded-xl bg-accent-attack/15 border border-accent-attack/25 text-accent-attack font-semibold text-sm hover:bg-accent-attack/25", children: "\uD83D\uDDE1\uFE0F \u884C\u52A8\u724C" }), _jsx("button", { onClick: () => handleBucketLock('strategy'), className: "flex-1 py-3 rounded-xl bg-accent-equip/15 border border-accent-equip/25 text-accent-equip font-semibold text-sm hover:bg-accent-equip/25", children: "\uD83C\uDFAF \u9526\u56CA\u724C" })] })] }) })), showEquipDialog && opponent && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-xs w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\uD83C\uDFA3 \u8BE1\u5F02\u9493\u7AFF" }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u9009\u62E9\u8981\u4E22\u5F03\u7684\u88C5\u5907\uFF1A" }), _jsxs("div", { className: "space-y-2", children: [['equip', 'weapon', 'field'].map(slot => {
                                    const item = opponent.equipment[slot];
                                    if (!item)
                                        return null;
                                    return (_jsxs("button", { onClick: () => handleEquipSelect(slot), className: "w-full flex items-center gap-3 p-3 rounded-xl border border-card-border hover:border-accent-attack/40 transition-colors hover:bg-card-bg/50 text-left", children: [_jsx("img", { src: getCardImageUrl(item.id), alt: "", className: "w-8 h-8 object-contain" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-semibold text-text-primary", children: item.name }), _jsx("span", { className: "text-xs text-text-secondary ml-2", children: slot === 'equip' ? '装备' : slot === 'weapon' ? '武器' : '场地' })] })] }, slot));
                                }), (!opponent.equipment.equip && !opponent.equipment.weapon && !opponent.equipment.field) && (_jsx("p", { className: "text-sm text-text-secondary text-center py-4", children: "\u76EE\u6807\u6CA1\u6709\u4EFB\u4F55\u88C5\u5907" }))] }), _jsx("button", { onClick: handleEquipCancel, className: "w-full mt-4 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50", children: "\u53D6\u6D88" })] }) })), showDraftDialog && draftCardsList.length > 0 && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", onClick: () => setShowDraftDialog(false), children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\uD83D\uDE82 \u8FD0\u8F93\u77FF\u8F66" }), _jsx("p", { className: "text-sm text-text-secondary mb-4", children: "\u9009\u62E9\u4E00\u5F20\u724C\u52A0\u5165\u624B\u724C\uFF1A" }), _jsx("p", { className: "text-xs text-accent-shield mb-2", children: me?.draftPlayerPick === 0 ? "轮到出牌方选牌" : "轮到对手选牌" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: draftCardsList.map((card, idx) => {
                                const isPicked = me?.draftPickedBy && me.draftPickedBy[idx];
                                const pickerName = isPicked ? me.draftPickedBy[idx] : null;
                                return (_jsxs("button", { onClick: () => handleDraftSelect(idx), disabled: !!isPicked || !((me?.draftPlayerPick === 0 && isMyTurn) || (me?.draftPlayerPick === 1 && !isMyTurn)), className: 'flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ' + (isPicked ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' : 'border-card-border hover:border-accent-shield/40 hover:bg-card-bg/50'), children: [_jsx("img", { src: getCardImageUrl(card.id), alt: "", className: "w-10 h-10 object-contain" }), _jsx("span", { className: "text-xs font-semibold text-text-primary text-center", children: card.name }), pickerName && _jsxs("span", { className: "text-[9px] text-text-secondary", children: [pickerName, " \u5DF2\u9009"] })] }, idx));
                            }) })] }) })), rematchState === 'invited' && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl text-center", children: [_jsx("div", { className: "text-4xl mb-3", children: "\u2694\uFE0F" }), _jsx("h3", { className: "text-lg font-bold text-text-primary mb-2", children: "\u518D\u6218\u9080\u8BF7" }), _jsxs("p", { className: "text-sm text-text-secondary mb-6", children: [rematchRequesterName ? `${rematchRequesterName} ` : '对方', "\u8BF7\u6C42\u518D\u6765\u4E00\u5C40\uFF01"] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: handleRematchAccept, className: "flex-1 py-2.5 rounded-xl bg-accent-heal/15 border border-accent-heal/25 text-accent-heal font-semibold text-sm hover:bg-accent-heal/25 transition-colors", children: "\u2705 \u63A5\u53D7" }), _jsx("button", { onClick: handleRematchDecline, className: "flex-1 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm hover:bg-card-bg/50 transition-colors", children: "\u2715 \u62D2\u7EDD" })] })] }) })), selectedCard && isCardExhausted(selectedCard) && (_jsx("div", { className: "fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in", children: _jsx("div", { className: "bg-white border border-accent-equip/30 rounded-xl px-5 py-3 shadow-lg text-sm text-accent-equip font-medium", children: "\u26A0\uFE0F \u672C\u56DE\u5408\u884C\u52A8/\u9526\u56CA\u6B21\u6570\u5DF2\u7528\u5B8C" }) })), showOptions && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm", onClick: () => setShowOptions(false), children: _jsxs("div", { className: "bg-card-bg border border-card-border rounded-2xl p-6 max-w-xs w-full mx-4 shadow-xl", onClick: e => e.stopPropagation(), children: [_jsxs("h3", { className: "text-lg font-bold text-text-primary mb-4 text-center", children: ["\u623F\u95F4\u53F7\uFF1A", player?.roomId ?? '----'] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("button", { onClick: () => {
                                        setShowOptions(false);
                                        setShowCollection(true);
                                    }, className: "w-full py-3 rounded-xl border border-card-border text-text-secondary text-sm font-medium hover:bg-card-bg/50 transition-colors", children: "\uD83D\uDCD6 \u56FE\u9274" }), _jsx("button", { onClick: () => {
                                        setShowOptions(false);
                                        setShowRules(true);
                                    }, className: "w-full py-3 rounded-xl border border-card-border text-text-secondary text-sm font-medium hover:bg-card-bg/50 transition-colors", children: "\uD83D\uDCCB \u89C4\u5219" }), _jsx("button", { onClick: async () => {
                                        setShowOptions(false);
                                        await surrender();
                                    }, className: "w-full py-3 rounded-xl border border-accent-damage/30 text-accent-damage text-sm font-medium hover:bg-accent-damage/10 transition-colors", children: "\uD83C\uDFF3\uFE0F \u6295\u964D" })] })] }) })), showCollection && (_jsx(CollectionModal, { onClose: () => setShowCollection(false) })), showRules && (_jsx(RulesModal, { onClose: () => setShowRules(false) }))] }));
}
//# sourceMappingURL=Game.js.map