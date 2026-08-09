import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

interface Trigger {
  id: number;
  text: string;
}

interface TriggerStore {
  triggers: Trigger[];
  addTrigger: (text: string) => void;
  clearTriggers: () => void;
}

let triggerId = 0;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const useTriggerStore = create<TriggerStore>((set) => ({
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
    // 时长与 PlayedCardOverlay 统一由 settingsStore.cardOverlayDuration 控制
    if (clearTimer) clearTimeout(clearTimer);
    const duration = useSettingsStore.getState().cardOverlayDuration;
    clearTimer = setTimeout(() => {
      set({ triggers: [] });
      clearTimer = null;
    }, duration);
  },

  clearTriggers: () => {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    set({ triggers: [] });
  },
}));

/** 任意位置调用：在打出卡牌提示框下方显示触发效果，自动清空（时长由 settingsStore 控制） */
export function displayTrigger(text: string) {
  useTriggerStore.getState().addTrigger(text);
}
