import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { displayMessage } from '../store/notificationStore';
import { displayTrigger } from '../store/triggerStore';
// 全局单例 socket
let globalSocket = null;
function getSocket() {
    if (!globalSocket) {
        globalSocket = io(window.location.origin, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }
    return globalSocket;
}
export function useSocket() {
    const socketRef = useRef(null);
    const { setConnected, setPlayer, setGameState, setWaitingForOpponent, reset, } = useGameStore();
    // 连接
    const connect = useCallback(() => {
        const socket = getSocket();
        socket.connect();
        socketRef.current = socket;
    }, []);
    // 断开
    const disconnect = useCallback(() => {
        const socket = getSocket();
        socket.disconnect();
        socketRef.current = null;
        reset();
    }, [reset]);
    // 修改 createRoom 和 joinRoom，保存数据到本地存储
    const createRoom = useCallback((playerName) => {
        return new Promise((resolve, reject) => {
            const socket = getSocket();
            socket.emit('create_room', playerName, (response) => {
                if (response.roomId) {
                    // 新增：保存到本地存储
                    localStorage.setItem('gamePlayer', JSON.stringify({
                        id: response.playerId,
                        name: playerName,
                        roomId: response.roomId
                    }));
                    setPlayer({ id: response.playerId, name: playerName, roomId: response.roomId });
                    setWaitingForOpponent(true);
                    resolve(response);
                }
                else {
                    reject(new Error('创建房间失败'));
                }
            });
        });
    }, [setPlayer, setWaitingForOpponent]);
    // 加入房间
    const joinRoom = useCallback((roomId, playerName) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('join_room', { roomId, playerName }, (response) => {
                if (response.success && response.playerId) {
                    // 新增：保存到本地存储
                    localStorage.setItem('gamePlayer', JSON.stringify({
                        id: response.playerId,
                        name: playerName,
                        roomId: roomId
                    }));
                    setPlayer({ id: response.playerId, name: playerName, roomId });
                    resolve(response);
                }
                else {
                    resolve(response);
                }
            });
        });
    }, [setPlayer]);
    // 出牌
    const playCard = useCallback((cardId, targetId) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('play_card', { cardId, targetId }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 结束回合
    const endTurn = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('end_turn', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 丢弃手牌
    const discardCard = useCallback((cardId) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('discard_card', { cardId }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 卸下装备
    const unequipCard = useCallback((slot) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('unequip_card', { slot }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 修改 leaveRoom，清除本地存储
    const leaveRoom = useCallback(() => {
        const socket = getSocket();
        socket.emit('leave_room');
        localStorage.removeItem('gamePlayer'); // 新增：清理数据
        reset();
    }, [reset]);
    // 侦测器：猜测权重
    const guessWeight = useCallback((guess) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('guess_weight', { guess }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 诡异钓竿：选择装备
    const equipChoice = useCallback((slot) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('equip_choice', { slot }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 诡异钓竿：取消选择，返还卡牌
    const cancelEquipChoice = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('cancel_equip_choice', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 蜘蛛网：选择封锁类型
    const bucketChoice = useCallback((lockType) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('bucket_choice', { lockType }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 运输矿车：选牌
    const draftPick = useCallback((cardIndex) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('draft_pick', { cardIndex }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 酿造台：选择转化方向
    const brewChoice = useCallback((cardId) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('brew_choice', { cardId }, (response) => {
                resolve(response);
            });
        });
    }, []);
    //烈焰棒：确认丢弃手牌
    const blazeDiscard = useCallback((confirm) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('blaze_discard', { confirm }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 再战
    const rematchRequest = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('rematch_request', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    const rematchAccept = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('rematch_accept', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    const rematchDecline = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('rematch_decline', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 调试：摸指定卡牌
    const debugDrawCard = useCallback((cardId) => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('debug_draw_card', { cardId }, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 投降
    const surrender = useCallback(() => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('surrender', {}, (response) => {
                resolve(response);
            });
        });
    }, []);
    // 初始化事件监听
    useEffect(() => {
        const socket = getSocket();
        socket.on('connect', () => {
            console.log('[Socket] 已连接');
            setConnected(true);
            // 新增：自动重连逻辑
            const savedPlayer = localStorage.getItem('gamePlayer');
            if (savedPlayer) {
                try {
                    const { playerId, roomId, name } = JSON.parse(savedPlayer);
                    console.log('[Socket] 检测到断线记录，尝试重连...', playerId);
                    socket.emit('rejoin', { playerId, roomId }, (res) => {
                        if (res.success) {
                            console.log('[Socket] 重连成功');
                            setPlayer({ id: playerId, name, roomId });
                            // 不在此处设置 gameState — 等待 state_update 事件发送过滤后的状态
                        }
                        else {
                            console.log('[Socket] 重连失败，房间可能已解散', res.error);
                            localStorage.removeItem('gamePlayer'); // 清理无效数据
                            // 可选：在这里提示用户房间失效
                        }
                    });
                }
                catch (e) {
                    console.error('[Socket] 解析本地存档失败', e);
                    localStorage.removeItem('gamePlayer');
                }
            }
        });
        socket.on('disconnect', () => {
            console.log('[Socket] 已断开');
            setConnected(false);
        });
        socket.on('player_joined', (data) => {
            console.log('[Socket] 有玩家加入', data);
            setWaitingForOpponent(false);
            // 【新增】如果人齐了（2人），说明对手在线，清除断线标记
            if (data.playerCount === 2) {
                useGameStore.getState().setOpponentDisconnected(false);
            }
        });
        socket.on('game_started', (state) => {
            console.log('[Socket] 游戏开始', state);
            setGameState(state);
            setWaitingForOpponent(false);
        });
        socket.on('state_update', (state) => {
            console.log('[Socket] 状态更新', state);
            setGameState(state);
        });
        socket.on('game_over', (data) => {
            console.log('[Socket] 游戏结束', data);
            setGameState(data.state);
        });
        socket.on('opponent_left', () => {
            console.log('[Socket] 对手已断开连接');
            displayMessage('对手已断开连接');
            // 【新增】设置断线标记
            useGameStore.getState().setOpponentDisconnected(true);
        });
        socket.on('error', (error) => {
            console.error('[Socket] 错误', error);
            if (error.includes('房间不存在') || error.includes('未找到房间')) {
                reset();
                window.location.reload();
            }
        });
        socket.on('rematch_invite', (data) => {
            console.log('[Socket] 收到再战邀请', data);
            useGameStore.getState().setRematchState('invited', data.requesterName);
        });
        socket.on('rematch_start', (state) => {
            console.log('[Socket] 再战开始', state);
            useGameStore.getState().setRematchState(null);
            useGameStore.getState().setGameState(state);
        });
        socket.on('rematch_declined', () => {
            console.log('[Socket] 再战被拒绝');
            useGameStore.getState().setRematchState('declined');
            setTimeout(() => useGameStore.getState().setRematchState(null), 2000);
        });
        socket.on('server_notify', (data) => {
            console.log('[Notify] 客户端收到 server_notify:', data);
            const me = useGameStore.getState().player;
            const isMyTurn = useGameStore.getState().isMyTurn;
            if (data.target === 'all') {
                displayMessage(data.text);
            }
            else if (data.target === 'self' && isMyTurn) {
                displayMessage(data.text);
            }
            else if (data.target === 'opponent' && !isMyTurn) {
                displayMessage(data.text);
            }
        });
        socket.on('server_trigger', (data) => {
            console.log('[Trigger] 客户端收到 server_trigger:', data);
            const isMyTurn = useGameStore.getState().isMyTurn;
            if (data.target === 'all') {
                displayTrigger(data.text);
            }
            else if (data.target === 'self' && isMyTurn) {
                displayTrigger(data.text);
            }
            else if (data.target === 'opponent' && !isMyTurn) {
                displayTrigger(data.text);
            }
        });
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('player_joined');
            socket.off('game_started');
            socket.off('state_update');
            socket.off('game_over');
            socket.off('opponent_left');
            socket.off('error');
            socket.off('rematch_invite');
            socket.off('rematch_start');
            socket.off('rematch_declined');
            socket.off('server_notify');
            socket.off('server_trigger');
        };
    }, [setConnected, setGameState, setWaitingForOpponent, reset, setPlayer]);
    return {
        connect,
        disconnect,
        createRoom,
        joinRoom,
        playCard,
        endTurn,
        discardCard,
        unequipCard,
        leaveRoom,
        guessWeight,
        draftPick,
        bucketChoice,
        equipChoice,
        cancelEquipChoice,
        brewChoice,
        blazeDiscard,
        debugDrawCard,
        rematchRequest,
        rematchAccept,
        rematchDecline,
        surrender,
    };
}
//# sourceMappingURL=useSocket.js.map