import { create } from 'zustand';
/**
 * 全局显示设置 store。
 *
 * 目前仅包含打出提示相关时长，后续添加设置界面时在此扩展。
 */
export const useSettingsStore = create((set) => ({
    cardOverlayDuration: 2200,
    setCardOverlayDuration: (ms) => set({ cardOverlayDuration: ms }),
}));
//# sourceMappingURL=settingsStore.js.map