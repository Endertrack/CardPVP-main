import { ReactNode } from 'react';
import { CardDef } from '@shared/types';
import { getCardImageUrl } from '../utils/cardImage';
import { useSettingsStore } from '../store/settingsStore';

interface Props {
  card: CardDef;
  playerName: string;
  children?: ReactNode;
}

export default function PlayedCardOverlay({ card, playerName, children }: Props) {
  const duration = useSettingsStore((s) => s.cardOverlayDuration);
  // 淡入 400ms，淡出 500ms，淡出延迟 = (总时长 - 400ms) / 1000
  const fadeOutDelay = (duration - 400) / 1000;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
      <div className="bg-card-bg/95 backdrop-blur-sm border-2 border-accent-equip rounded-xl p-3 shadow-2xl flex flex-col items-center gap-1 animate-card-fly-in"
        style={{ animation: `cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in ${fadeOutDelay}s both` }}>
        <img src={getCardImageUrl(card.id)} alt={card.name} className="w-12 h-12 object-contain" />
        <span className="text-sm font-bold text-text-primary">{card.name}</span>
        <span className="text-[10px] text-text-secondary">{playerName} 打出了此牌</span>
      </div>
      {children}
    </div>
  );
}
