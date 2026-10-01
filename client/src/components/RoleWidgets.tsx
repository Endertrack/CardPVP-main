import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { getRoleById, getRoleIconPath } from '@shared/roles';
import { useT } from '../i18n/i18n';

/** 角色图标（低像素 png 用 pixelated 渲染保证清晰，加载失败时隐藏） */
function RoleIcon({ className }: { className?: string }) {
  const roleId = useSettingsStore((s) => s.roleId);
  const role = getRoleById(roleId);
  return (
    <img
      src={getRoleIconPath(role.id)}
      alt={role.name}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
    />
  );
}

/**
 * 竖屏操作栏第一行：角色选择入口按钮。
 * 角色图标靠左 + 角色名称紧挨 + 按钮内靠右「点击更改」。
 */
export function RoleEntryBtn() {
  const t = useT();
  const role = getRoleById(useSettingsStore((s) => s.roleId));
  return (
    <button
      onClick={() => useGameStore.getState().setPage('roleSelect')}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-card-bg border border-card-border hover:border-accent-shield/30 transition-colors active:scale-[0.99]"
    >
      <RoleIcon className="shrink-0 w-7 h-7 object-contain" />
      <span className="text-sm font-semibold text-text-primary">{role.name}</span>
      <span className="ml-auto text-xs text-text-secondary">{t('点击更改', 'Tap to change')}</span>
    </button>
  );
}

/**
 * 横屏右栏上半部分：角色选择栏。
 * 顶部「角色选择」文本 / 中上角色图标 / 中下角色名称 / 底部「更换角色」按钮。
 */
export function RolePanel() {
  const t = useT();
  const role = getRoleById(useSettingsStore((s) => s.roleId));
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-3 gap-2 border-b border-card-border/30 min-h-0">
      <p className="text-xs font-medium text-text-secondary shrink-0">{t('角色选择', 'Role')}</p>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1.5 w-full">
        <RoleIcon className="w-14 h-14 object-contain" />
        <p className="text-sm font-bold text-text-primary">{role.name}</p>
      </div>
      <button
        onClick={() => useGameStore.getState().setPage('roleSelect')}
        className="w-full py-2 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm hover:text-accent-shield hover:border-accent-shield/30 transition-colors active:scale-95 shrink-0"
      >
        {t('更换角色', 'Change Role')}
      </button>
    </div>
  );
}
