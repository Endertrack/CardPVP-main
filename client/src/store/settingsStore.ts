import { create } from 'zustand';

interface SettingsStore {
  /** 打出提示（PlayedCardOverlay）和打出效果提示（TriggerEffectPanel）的显示时长（毫秒） */
  cardOverlayDuration: number;
  /** 设置显示时长（未来设置界面调用） */
  setCardOverlayDuration: (ms: number) => void;
}

/**
 * 全局显示设置 store。
 *
 * 目前仅包含打出提示相关时长，后续添加设置界面时在此扩展。
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  cardOverlayDuration: 4000,
  setCardOverlayDuration: (ms) => set({ cardOverlayDuration: ms }),
}));
