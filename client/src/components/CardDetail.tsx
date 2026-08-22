import { useEffect } from 'react';
import { CardDef, COST_TYPE_NAMES, ActiveBuff } from '@shared/types';
import { parseIcon } from '@shared/constants';
import { getCardImageUrl } from '../utils/cardImage';
import BuffBadge from './BuffBadge';

interface Props {
  card: CardDef & { buffs?: ActiveBuff[] };
  onClose: () => void;
}

/** 类型 → 标签样式（胶囊形 + 描边，质感更强） */
const TYPE_STYLE: Record<string, string> = {
  action: 'bg-accent-attack/10 text-accent-attack ring-accent-attack/30',
  strategy: 'bg-accent-equip/10 text-accent-equip ring-accent-equip/30',
  heal: 'bg-accent-heal/10 text-accent-heal ring-accent-heal/30',
  attack: 'bg-accent-attack/10 text-accent-attack ring-accent-attack/30',
  buff: 'bg-accent-buff/10 text-accent-buff ring-accent-buff/30',
  debuff: 'bg-purple-500/10 text-purple-300 ring-purple-400/30',
  event: 'bg-blue-500/10 text-blue-300 ring-blue-400/30',
  equip: 'bg-accent-equip/10 text-accent-equip ring-accent-equip/30',
  weapon: 'bg-accent-equip/10 text-accent-equip ring-accent-equip/30',
  field: 'bg-accent-equip/10 text-accent-equip ring-accent-equip/30',
  counter: 'bg-accent-shield/10 text-accent-shield ring-accent-shield/30',
};
const FALLBACK_TAG = 'bg-accent-shield/10 text-accent-shield ring-accent-shield/30';

/** 类型 → 主题辉光色（头图光环 + 顶部装饰光带共用） */
const TYPE_GLOW: Record<string, string> = {
  action: 'bg-accent-attack/25',
  strategy: 'bg-accent-equip/25',
  heal: 'bg-accent-heal/25',
  attack: 'bg-accent-attack/25',
  buff: 'bg-accent-buff/25',
  debuff: 'bg-purple-500/25',
  event: 'bg-blue-500/25',
  equip: 'bg-accent-equip/25',
  weapon: 'bg-accent-equip/25',
  field: 'bg-accent-equip/25',
  counter: 'bg-accent-shield/25',
};
const FALLBACK_GLOW = 'bg-accent-shield/25';

export default function CardDetail({ card, onClose }: Props) {
  const cardTypes = parseIcon(card.icon);
  const glow = TYPE_GLOW[cardTypes[0]] || FALLBACK_GLOW;

  // 支持 Esc 键关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-80 max-w-full bg-card-bg/95 backdrop-blur-xl border border-card-border/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部主题色装饰光带 */}
        <div
          className={`pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl ${glow}`}
        />

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/25 text-text-secondary/80 text-xl leading-none backdrop-blur-sm transition-all duration-300 hover:bg-black/50 hover:text-text-primary hover:rotate-90"
        >
          ×
        </button>

        {/* ── ① 头图：主题色光环 + 双圈装饰 ── */}
        <div className="relative flex justify-center pt-9 pb-4">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-xl ${glow}`} />
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-2 rounded-full border border-white/5" />
            <img
              src={getCardImageUrl(card.id)}
              alt={card.name}
              className="relative w-20 h-20 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* ── ② 名称 + 类型 ── */}
        <div className="px-6 text-center">
          <h2 className="text-lg font-bold text-text-primary tracking-wide">{card.name}</h2>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
            {cardTypes.map((t, i) => (
              <span
                key={i}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ${
                  TYPE_STYLE[t] || FALLBACK_TAG
                }`}
              >
                {COST_TYPE_NAMES[t] || '其他'}
              </span>
            ))}
          </div>
        </div>

        {/* ── ③ 状态 ── */}
        {card.buffs && card.buffs.length > 0 && (
          <section className="px-6 pt-1">
            <SectionDivider label="状态" />
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {card.buffs.map((buff, i) => (
                <BuffBadge key={i} buff={buff} compactMode={false} />
              ))}
            </div>
          </section>
        )}

        {/* ── ④ 描述 ── */}
        <section className="px-6 pt-1 pb-6">
          <SectionDivider label="描述" />
          <div className="rounded-xl bg-black/20 border border-card-border/50 px-4 py-3">
            <p className="text-xs text-text-secondary leading-relaxed">{card.description}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

/** 居中文字分隔线：── 状 态 ── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex-1 h-px bg-gradient-to-r from-transparent to-card-border/80" />
      <span className="text-[10px] font-semibold text-text-secondary/50 tracking-[0.3em]">
        {label}
      </span>
      <span className="flex-1 h-px bg-gradient-to-l from-transparent to-card-border/80" />
    </div>
  );
}
