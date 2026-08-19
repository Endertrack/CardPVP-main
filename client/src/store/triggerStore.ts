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
      // 尝试找到可合并的已有条目（即使中间隔了不同提示也要合并）
      // 条件：新条目和已有条目都只含一个 hpChange 段，且 playerName 和 isHeal 相同
      if (isPureHpChange(segments)) {
        for (let i = state.triggers.length - 1; i >= 0; i--) {
          const existing = state.triggers[i];
          if (canMerge(existing.segments, segments)) {
            const merged = mergeSegments(existing.segments, segments);
            const updated = [...state.triggers];
            updated[i] = { ...existing, segments: merged, createdAt: Date.now() };
            return { triggers: updated };
          }
        }
      }

      const entry: TriggerEntry = { id, segments, createdAt: Date.now() };
      const newTriggers = [...state.triggers, entry];
      // 限制最大显示数量（最多 8 条，防止刷屏）
      if (newTriggers.length > 8) {
        newTriggers.splice(0, newTriggers.length - 8);
      }
      return { triggers: newTriggers };
    });

    // 判断是否发生了合并
    const mergedExistingId = (() => {
      let result: number | null = null;
      set((state) => {
        // 如果最后新增的 id 没有在 triggers 中（说明被合并了而非新增），找出被合并的那条
        const hasNew = state.triggers.some(t => t.id === id);
        if (!hasNew && isPureHpChange(segments)) {
          // 找到刚被更新的那条（createdAt 被重置了）
          const found = state.triggers.find(t =>
            t.segments.length === 1 && t.segments[0].type === 'hpChange'
            && t.createdAt > Date.now() - 200 // 刚刚被重置
          );
          if (found) result = found.id;
        }
        // 不修改 state，只是用来读
        return {};
      });
      return result;
    })();

    // 如果是合并到已有条目，重置那条的计时器
    if (mergedExistingId !== null) {
      const oldTimer = entryTimers.get(mergedExistingId);
      if (oldTimer) clearTimeout(oldTimer);
      const duration = useSettingsStore.getState().cardOverlayDuration;
      const timer = setTimeout(() => {
        set((state) => ({
          triggers: state.triggers.filter(t => t.id !== mergedExistingId),
        }));
        entryTimers.delete(mergedExistingId);
      }, duration);
      entryTimers.set(mergedExistingId, timer);
      return;
    }

    // 新条目：设置独立计时器
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

/** 判断 segments 是否只含一个 hpChange 段 */
function isPureHpChange(segments: ContentSegment[]): boolean {
  return segments.length === 1 && segments[0].type === 'hpChange';
}

/**
 * 判断两组 segments 是否可以合并：
 * 两组都只含一个 hpChange 段，且 playerName 和 isHeal 相同
 */
function canMerge(a: ContentSegment[], b: ContentSegment[]): boolean {
  if (isPureHpChange(a) && isPureHpChange(b)) {
    const aName = a[0].playerName || '';
    const bName = b[0].playerName || '';
    const aHeal = a[0].isHeal ?? (a[0].hpDelta ?? 0) > 0;
    const bHeal = b[0].isHeal ?? (b[0].hpDelta ?? 0) > 0;
    return aName === bName && aHeal === bHeal;
  }
  return false;
}

/**
 * 合并两组 segments：格式为多个数字并列
 * 如 "+2 +1" 或 "-3 -1"，用空格分隔
 */
function mergeSegments(a: ContentSegment[], b: ContentSegment[]): ContentSegment[] {
  const aVal = a[0].hpDelta || 0;
  const bVal = b[0].hpDelta || 0;
  // 从已有 segments 中提取所有数字（可能是合并过的多数字格式）
  const aText = a[0].text || '';
  // 如果已有 text（之前合并过），追加新数字
  if (aText) {
    const newText = `${aText} ${bVal > 0 ? '+' : ''}${bVal}`;
    return [{ type: 'hpChange', playerName: a[0].playerName, hpDelta: aVal + bVal, isHeal: a[0].isHeal, text: newText }];
  }
  // 首次合并：两个数字并列
  const newText = `${aVal > 0 ? '+' : ''}${aVal} ${bVal > 0 ? '+' : ''}${bVal}`;
  return [{ type: 'hpChange', playerName: a[0].playerName, hpDelta: aVal + bVal, isHeal: a[0].isHeal, text: newText }];
}
