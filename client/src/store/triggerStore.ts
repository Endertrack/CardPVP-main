import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { ContentSegment, TriggerEntry } from '@shared/types';

interface TriggerStore {
  triggers: TriggerEntry[];
  addTrigger: (segments: ContentSegment[]) => void;
  clearTriggers: () => void;
}

let triggerId = 0;
// 每条提示独立的计时器映射
const entryTimers = new Map<number, ReturnType<typeof setTimeout>>();

export const useTriggerStore = create<TriggerStore>((set) => ({
  triggers: [],

  addTrigger: (segments) => {
    const id = ++triggerId;

    set((state) => {
      // 尝试与最后一条合并（相同类型的 hpChange 合并数值）
      const last = state.triggers[state.triggers.length - 1];
      if (last && canMerge(last.segments, segments)) {
        const merged = mergeSegments(last.segments, segments);
        const updated = [...state.triggers];
        updated[updated.length - 1] = { ...last, segments: merged };
        return { triggers: updated };
      }

      const entry: TriggerEntry = { id, segments, createdAt: Date.now() };
      const newTriggers = [...state.triggers, entry];
      // 限制最大显示数量（最多 8 条，防止刷屏）
      if (newTriggers.length > 8) {
        newTriggers.splice(0, newTriggers.length - 8);
      }
      return { triggers: newTriggers };
    });

    // 每条独立计时（需求 6）
    const duration = useSettingsStore.getState().cardOverlayDuration;
    const timer = setTimeout(() => {
      set((state) => ({
        triggers: state.triggers.filter(t => t.id !== id),
      }));
      entryTimers.delete(id);
    }, duration);
    entryTimers.set(id, timer);
  },

  clearTriggers: () => {
    // 清除所有计时器
    for (const timer of entryTimers.values()) clearTimeout(timer);
    entryTimers.clear();
    set({ triggers: [] });
  },
}));

/** 任意位置调用：在打出卡牌提示框下方显示触发效果，每条独立超时淡出 */
export function displayTrigger(data: string | ContentSegment[]) {
  let segments: ContentSegment[];
  if (typeof data === 'string') {
    // 尝试解析 JSON（新格式：{ type: 'rich', segments: [...] }）
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.type === 'rich' && Array.isArray(parsed.segments)) {
        segments = parsed.segments;
      } else {
        // 普通文本（旧格式兼容）
        segments = [{ type: 'text', text: data }];
      }
    } catch {
      // 纯文本
      segments = [{ type: 'text', text: data }];
    }
  } else {
    segments = data;
  }
  useTriggerStore.getState().addTrigger(segments);
}

/**
 * 判断两组 segments 是否可以合并：
 * 两组都只含一个 hpChange 段，且 playerName 相同（含空名也视为相同）
 */
function canMerge(a: ContentSegment[], b: ContentSegment[]): boolean {
  // 两组都只有一个 hpChange 段
  if (a.length === 1 && b.length === 1
      && a[0].type === 'hpChange' && b[0].type === 'hpChange') {
    return (a[0].playerName || '') === (b[0].playerName || '');
  }
  return false;
}

/** 合并两组 segments：hpDelta 相加 */
function mergeSegments(a: ContentSegment[], b: ContentSegment[]): ContentSegment[] {
  const merged: ContentSegment = {
    type: 'hpChange',
    playerName: a[0].playerName,
    hpDelta: (a[0].hpDelta || 0) + (b[0].hpDelta || 0),
  };
  return [merged];
}
