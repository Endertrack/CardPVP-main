import { ReactNode } from 'react';
import { CardDef } from '@shared/types';
import { getCardImageUrl } from '../utils/cardImage';
import { useSettingsStore } from '../store/settingsStore';

type OverlayVariant = 'self' | 'opponent' | 'discard';

interface Props {
  card: CardDef;
  playerName: string;
  variant?: OverlayVariant;
  children?: ReactNode;
}

const VARIANT_STYLES: Record<OverlayVariant, { border: string; text: string }> = {
  self:     { border: 'border-accent-heal',    text: '打出了此牌' },
  opponent: { border: 'border-accent-attack',  text: '打出了此牌' },
  discard:  { border: 'border-accent-shield', text: '丢弃了此牌' },
};

export default function PlayedCardOverlay({ card, playerName, variant = 'opponent', children }: Props) {
  const duration = useSettingsStore((s) => s.cardOverlayDuration);
  // 淡入 400ms，淡出 500ms，淡出延迟 = (总时长 - 400ms) / 1000
  const fadeOutDelay = (duration - 400) / 1000;
  const style = VARIANT_STYLES[variant];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
      <div className={`bg-card-bg/95 backdrop-blur-sm border-2 ${style.border} rounded-xl p-3 shadow-2xl flex flex-col items-center gap-1 animate-card-fly-in`}
        style={{ animation: `cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in ${fadeOutDelay}s both` }}>
        <img src={getCardImageUrl(card.id)} alt={card.name} className="w-12 h-12 object-contain" />
        <span className="text-sm font-bold text-text-primary">{card.name}</span>
        <span className="text-[10px] text-text-secondary">{playerName} {style.text}</span>
      </div>
      {children}
    </div>
  );
}
