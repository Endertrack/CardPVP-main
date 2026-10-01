import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { getRoleById, getRoleIconPath } from '@shared/roles';
import { useT } from '../i18n/i18n';

/**
 * 角色选择页（当前为空壳）。
 * 左上角返回房间列表；具体角色选择内容下一步补充。
 */
export default function RoleSelect() {
  const t = useT();
  const roleId = useSettingsStore((s) => s.roleId);
  const role = getRoleById(roleId);

  return (
    <div className="min-h-viewport flex flex-col p-4">
      {/* 顶部返回栏 */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => useGameStore.getState().setPage('roomList')}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-card-bg border border-card-border text-text-secondary hover:text-text-primary hover:border-accent-shield/30 transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-text-primary">{t('角色选择', 'Select Role')}</h1>
      </div>

      {/* 内容区（空壳，下一步填充角色选择界面） */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <img
          src={getRoleIconPath(role.id)}
          alt={role.name}
          className="w-20 h-20 object-contain opacity-40"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
        />
        <p className="text-sm text-text-secondary">{t('角色选择界面建设中，敬请期待', 'Role selection coming soon')}</p>
      </div>
    </div>
  );
}
