import { create } from 'zustand';
import { DEFAULT_ROLE_ID } from '@shared/roles';

const STORAGE_KEY = 'cardPvpSettings';

/** 昵称长度上限（与输入框 maxLength、服务端展示保持一致） */
export const NICKNAME_MAX_LENGTH = 12;

/** 主大厅左下角展示的最近更改文本（直接改这里即可） */
export const RECENT_CHANGES = '最近更改：行动牌权重调整 蛋糕效果更改 加入角色玩法';

/** 打出牌提示样式：卡片（弹出完整卡牌 Overlay） / 提示框（用 displayMessage 弹出文字+卡图） */
export type PlayedCardHint = 'card' | 'toast';

/** 界面语言 */
export type AppLang = 'zh' | 'en';

/** 需要持久化到 localStorage 的设置项 */
interface PersistedSettings {
  cardOverlayDuration: number;
  playedCardHint: PlayedCardHint;
  lang: AppLang;
  /** 玩家昵称：创建/加入房间时使用，空字符串代表未设置 */
  nickname: string;
  /** 当前选中的角色 id（对应 shared/roles.ts 的 ROLES，持久化到 localStorage） */
  roleId: number;
}

/** 从 localStorage 读取已保存的设置 */
function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch { /* 忽略损坏数据 */ }
  return {};
}

/** 持久化设置到 localStorage */
function persist(settings: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* 忽略存储失败 */ }
}

/** 去掉首尾空白并截断到长度上限，用于实际发往服务端的昵称 */
export function normalizeNickname(raw: string): string {
  return (raw || '').replace(/\s+/g, ' ').trim().slice(0, NICKNAME_MAX_LENGTH);
}

interface SettingsStore extends PersistedSettings {
  /** 设置显示时长 */
  setCardOverlayDuration: (ms: number) => void;
  /** 设置打出牌提示形式 */
  setPlayedCardHint: (mode: PlayedCardHint) => void;
  /** 设置界面语言 */
  setLang: (lang: AppLang) => void;
  /** 设置玩家昵称（写入时仅截断长度，首尾空白在实际使用时清理） */
  setNickname: (nickname: string) => void;
  /** 设置当前选中角色（持久化到 localStorage） */
  setSelectedRole: (roleId: number) => void;
}

/**
 * 全局显示设置 store。
 *
 * 包含打出提示相关设置（时长 + 形式）、界面语言与玩家昵称，通过 localStorage 持久化，
 * 刷新/重开后仍保留。
 */
export const useSettingsStore = create<SettingsStore>((set) => {
  const loaded = loadSettings();

  /** 统一写库：任何一项变更都会把完整设置写回 localStorage */
  const apply = (patch: Partial<PersistedSettings>) =>
    set((s) => {
      persist({
        cardOverlayDuration: s.cardOverlayDuration,
        playedCardHint: s.playedCardHint,
        lang: s.lang,
        nickname: s.nickname,
        roleId: s.roleId,
        ...patch,
      });
      return patch;
    });

  return {
    cardOverlayDuration: loaded.cardOverlayDuration ?? 5000,
    playedCardHint: loaded.playedCardHint ?? 'card',
    lang: loaded.lang ?? 'zh',
    nickname: loaded.nickname ?? '',
    roleId: loaded.roleId ?? DEFAULT_ROLE_ID,
    setCardOverlayDuration: (ms) => apply({ cardOverlayDuration: ms }),
    setPlayedCardHint: (mode) => apply({ playedCardHint: mode }),
    setLang: (lang) => apply({ lang }),
    setNickname: (nickname) => apply({ nickname: (nickname || '').slice(0, NICKNAME_MAX_LENGTH) }),
    setSelectedRole: (roleId) => apply({ roleId }),
  };
});
