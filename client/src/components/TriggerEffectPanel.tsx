import { useTriggerStore } from '../store/triggerStore';
import { useSettingsStore } from '../store/settingsStore';
import { ContentSegment, BuffType } from '@shared/types';
import { getCardImageUrl } from '../utils/cardImage';
import { BUFF_ICON_MAP } from './BuffCollection';

/** 获取 buff 图标 URL */
function getBuffImageUrl(buffType: BuffType): string | null {
  const iconNum = BUFF_ICON_MAP[buffType as string];
  return iconNum ? `/assets/buff/buff${iconNum}.png` : null;
}

/** 渲染单个内容段 */
function SegmentRenderer({ segment }: { segment: ContentSegment }) {
  switch (segment.type) {
    case 'text':
      return (
        <span className={`text-xs text-text-secondary ${segment.bold ? 'font-bold' : ''}`}>
          {segment.text}
        </span>
      );
    case 'card':
      return (
        <img
          src={getCardImageUrl(segment.cardId!)}
          alt=""
          className="w-5 h-5 object-contain shrink-0"
          style={{ imageRendering: 'pixelated' }}
        />
      );
    case 'buff': {
      const url = getBuffImageUrl(segment.buffType!);
      if (!url) return null;
      return (
        <img
          src={url}
          alt=""
          className="w-5 h-5 object-contain shrink-0"
          style={{ imageRendering: 'pixelated' }}
        />
      );
    }
    case 'hpChange': {
      const delta = segment.hpDelta || 0;
      const isHeal = segment.isHeal ?? delta > 0;
      // 如果有 text（合并后的多数字格式），显示 text；否则显示 hpDelta
      const displayText = segment.text || `${delta > 0 ? '+' : ''}${delta}`;
      return (
        <span className="text-xs whitespace-nowrap">
          {segment.playerName && (
            <span className="text-text-primary font-medium">{segment.playerName}</span>
          )}
          <span className={isHeal ? 'text-green-500 font-bold ml-0.5' : 'text-red-500 font-bold ml-0.5'}>
            {' '}{displayText}
          </span>
        </span>
      );
    }
    default:
      return null;
  }
}

/** 单条提示（独立淡出动画） */
function TriggerItem({ entry, duration }: { entry: { id: number; segments: ContentSegment[]; createdAt: number }; duration: number }) {
  const fadeOutDelay = (duration - 400) / 1000;
  return (
    <div
      className="flex items-center gap-1 flex-wrap transition-all duration-500 ease-out"
      style={{
        animation: `cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in ${fadeOutDelay}s both`,
      }}
    >
      {entry.segments.map((seg, i) => (
        <SegmentRenderer key={i} segment={seg} />
      ))}
    </div>
  );
}

/**
 * 触发效果提示面板
 * 展示在 PlayedCardOverlay 下方，风格与打出提示框一致。
 * 每条提示独立计算存在时间，超时淡化消失，下边的消息平滑跟着补上（需求 6）。
 */
export default function TriggerEffectPanel() {
  const triggers = useTriggerStore((s) => s.triggers);
  const duration = useSettingsStore((s) => s.cardOverlayDuration);

  if (triggers.length === 0) return null;

  return (
    <div
      className="bg-card-bg/95 backdrop-blur-sm border-2 border-accent-equip rounded-xl px-3 py-1.5 shadow-2xl flex flex-col items-start gap-0.5 mt-1"
    >
      {triggers.map((entry) => (
        <TriggerItem key={entry.id} entry={entry} duration={duration} />
      ))}
    </div>
  );
}
