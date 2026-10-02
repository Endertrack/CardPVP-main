import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { ROLES, getRoleById, getRoleIconPath, type RoleDef } from '@shared/roles';
import { useT } from '../i18n/i18n';

/** 效果文本渲染：[*n] → ⏱n（持续 n 回合） */
function fmtEffect(text: string): string {
  return text.replace(/\[\*(\d+)\]/g, '⏱$1');
}

/** 定位标签 emoji 映射（未知标签回退 🏷️） */
const TAG_EMOJI: Record<string, string> = {
  '输出': '⚔️',
  '凋零': '🥀',
  '回血': '💚',
  '护盾': '🛡️',
  '状态': '🧪',
  '运营': '🔄',
  '过牌': '🔁',
  '丢弃': '🗑️',
  '前期': '🌱',
  '防御': '🛡️',
  '辅助': '✨',
  '回复': '💚',
};

/** 核心机制 emoji 映射（未知机制回退 ⚙️） */
const MECHANIC_EMOJI: Record<string, string> = {
  '血量': '🩸',
  '血量上限': '💗',
  '护盾': '🛡️',
  '凋零': '🥀',
  '状态': '🧪',
  '丢弃': '🗑️',
  '手牌': '🃏',
  '护甲': '🛡️',
};

/** 多触发组序号 */
const SEQ = ['➊', '➋', '➌', '➍', '➎', '➏'];

/** 技能块：触发组（⏰时机 → 效果）与/或固有属性（🔒） */
function SkillBody({ skill }: { skill: import('@shared/roles').RoleSkill }) {
  const multi = skill.triggers.length > 1;
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      {skill.triggers.map((tr, i) => (
        <div key={i}>
          <p className="text-[10px] text-text-secondary leading-snug">
            {multi && <span className="mr-0.5">{SEQ[i]}</span>}⏰ {tr.timing}
          </p>
          <p className="text-xs text-text-primary/80 leading-snug pl-4">→ {fmtEffect(tr.effect)}</p>
        </div>
      ))}
      {skill.passives?.map((p, i) => (
        <p key={i} className="text-xs text-text-primary/80 leading-snug">🔒 {fmtEffect(p)}</p>
      ))}
    </div>
  );
}

/**
 * 角色卡片：图标 + 名称 + 定位标签 + 核心机制 + 技能列表 + 选择按钮
 */
export function RoleCard({ role, selected, onSelect, showSelect = true }: { role: RoleDef; selected: boolean; onSelect: () => void; showSelect?: boolean }) {
  const t = useT();
  return (
    <div
      className={`w-full max-w-xs rounded-xl border-2 p-3 flex flex-col gap-2 transition-colors ${
        selected
          ? 'border-accent-shield bg-accent-shield/10 shadow-lg shadow-accent-shield/10'
          : 'border-card-border bg-card-bg hover:border-accent-shield/40'
      }`}
    >
      {/* 头部：图标 + 名称 + 定位标签 */}
      <div className="flex items-center gap-3">
        <img
          src={getRoleIconPath(role.id)}
          alt={role.name}
          className="w-10 h-10 object-contain shrink-0"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
        />
        <div className="min-w-0">
          <p className="text-base font-bold text-text-primary">{role.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {role.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-full bg-page-bg border border-card-border/60 text-[10px] text-text-secondary">
                {TAG_EMOJI[tag] ?? '🏷️'} {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 核心机制 */}
      <p className="text-xs text-text-secondary">
        {role.mechanics.map(m => MECHANIC_EMOJI[m] ?? '⚙️').join(' ')} {t('核心机制', 'Mechanic')}：{role.mechanics.join(' / ')}
      </p>

      {/* 技能列表 */}
      <div className="flex flex-col gap-1.5">
        {role.skills.map(sk => (
          <div key={sk.name} className="rounded-xl bg-page-bg/60 border border-card-border/50 px-2.5 py-1.5">
            <p className="text-[13px] font-semibold text-text-primary">{sk.emoji} {sk.name}</p>
            <SkillBody skill={sk} />
          </div>
        ))}
      </div>

      {/* 选择按钮（对局内查看弹窗时不显示） */}
      {showSelect && <button
        onClick={onSelect}
        disabled={selected}
        className={`w-full mt-auto py-1.5 rounded-xl text-[13px] font-semibold transition-colors active:scale-95 ${
          selected
            ? 'bg-accent-shield/15 border border-accent-shield/40 text-accent-shield cursor-default'
            : 'bg-accent-shield border border-accent-shield text-white hover:bg-accent-shield/90'
        }`}
      >
        {selected ? `✓ ${t('已选择', 'Selected')}` : t('选择', 'Select')}
      </button>}
    </div>
  );
}

/**
 * 角色选择页：左上角返回；角色卡片列表（多角色自动换行平铺）。
 */
export default function RoleSelect() {
  const t = useT();
  const roleId = useSettingsStore((s) => s.roleId);
  const setSelectedRole = useSettingsStore((s) => s.setSelectedRole);
  const current = getRoleById(roleId);

  return (
    <div className="h-viewport flex flex-col p-4">
      {/* 顶部返回栏 */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => useGameStore.getState().setPage('roomList')}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-card-bg border border-card-border text-text-secondary hover:text-text-primary hover:border-accent-shield/30 transition-colors"
        >
          ←
        </button>
        <h1 className="text-base font-bold text-text-primary">{t('角色选择', 'Select Role')}</h1>
      </div>

      {/* 角色卡片列表 */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-wrap justify-center gap-3">
          {ROLES.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              selected={role.id === current.id}
              onSelect={() => setSelectedRole(role.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
