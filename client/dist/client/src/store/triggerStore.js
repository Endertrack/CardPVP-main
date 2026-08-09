import { create } from 'zustand';
let triggerId = 0;
let clearTimer = null;
export const useTriggerStore = create((set) => ({
    triggers: [],
    addTrigger: (text) => {
        const id = ++triggerId;
        set((state) => {
            const newTriggers = [...state.triggers, { id, text }];
            // 限制最大显示数量（最多6条，防止刷屏）
            if (newTriggers.length > 6) {
                newTriggers.splice(0, newTriggers.length - 6);
            }
            return { triggers: newTriggers };
        });
        // 重置自动清空计时器：每次新增都重新计时
        // 与 PlayedCardOverlay 的 2200ms 保持同步
        if (clearTimer)
            clearTimeout(clearTimer);
        clearTimer = setTimeout(() => {
            set({ triggers: [] });
            clearTimer = null;
        }, 2200);
    },
    clearTriggers: () => {
        if (clearTimer) {
            clearTimeout(clearTimer);
            clearTimer = null;
        }
        set({ triggers: [] });
    },
}));
/** 任意位置调用：在打出卡牌提示框下方显示触发效果，2.2 秒后自动清空 */
export function displayTrigger(text) {
    useTriggerStore.getState().addTrigger(text);
}
//# sourceMappingURL=triggerStore.js.map