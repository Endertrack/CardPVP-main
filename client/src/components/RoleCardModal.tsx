import { getRoleById } from '@shared/roles';
import { RoleCard } from '../pages/RoleSelect';
import { useT } from '../i18n/i18n';

/**
 * 对局内角色介绍弹窗：点击玩家头像打开，展示该玩家的角色卡片（无选择按钮）。
 */
export default function RoleCardModal({ roleId, onClose }: { roleId: number; onClose: () => void }) {
  const t = useT();
  const role = getRoleById(roleId);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center mb-2">
          <span className="text-sm font-bold text-white/90 drop-shadow">{role.emoji ?? ''} {role.name}</span>
        </div>
        <RoleCard role={role} selected={false} onSelect={() => {}} showSelect={false} />
        <div className="flex justify-center mt-3">
          <button
            onClick={onClose}
            className="px-6 py-1.5 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            {t('关闭', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
