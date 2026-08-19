import { GameLogEntry, ContentSegment, BuffType } from '@shared/types';
import { getCardImageUrl } from '../utils/cardImage';
import { BUFF_ICON_MAP } from './BuffCollection';

interface Props {
  log: GameLogEntry[];
  onClose: () => void;
}

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
        <span className={`text-xs ${segment.bold ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
          {segment.text}
        </span>
      );
    case 'card':
      return (
        <img
          src={getCardImageUrl(segment.cardId!)}
          alt=""
          className="w-5 h-5 object-contain shrink-0 inline-block align-middle"
          style={{ imageRendering: 'pixelated' }}
        />
      );
    case 'buff': {
      const url = getBuffImageUrl(segment.buffType!);
      return url ? (
        <img
          src={url}
          alt=""
          className="w-5 h-5 object-contain shrink-0 inline-block align-middle"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <span className="text-xs text-text-secondary">[{segment.buffType}]</span>
      );
    }
    case 'hpChange':
      return (
        <span className="text-xs font-medium inline-flex items-center gap-0.5">
          {segment.playerName && (
            <span className="text-text-primary">{segment.playerName}</span>
          )}
          <span className={segment.hpDelta! >= 0 ? 'text-green-500' : 'text-red-500'}>
            {segment.hpDelta! >= 0 ? `+${segment.hpDelta}` : `${segment.hpDelta}`}
          </span>
        </span>
      );
    default:
      return null;
  }
}

/** 渲染一行内容（多个段并排） */
function LineRenderer({ segments }: { segments: ContentSegment[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap leading-relaxed">
      {segments.map((seg, i) => (
        <SegmentRenderer key={i} segment={seg} />
      ))}
    </div>
  );
}

export default function GameLogPanel({ log, onClose }: Props) {
  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45"
        onClick={onClose}
      />

      {/* 面板主体 */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-card-bg/95 backdrop-blur-xl border-l border-card-border/50 shadow-2xl z-45 animate-slide-in-right flex flex-col rounded-l-2xl">

        {/* 头部区域 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-accent-primary rounded-full" />
            <h3 className="text-lg font-semibold text-text-primary tracking-wide">战斗记录</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域：渲染结构化日志 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {log.length === 0 && (
            <p className="text-center text-text-secondary text-sm mt-8">暂无战斗记录</p>
          )}
          {log.map((entry, idx) => {
            // 判断是否为回合结束/回合开始的强调消息
            const isEndTurn = entry.type === 'endTurn' && entry.message.includes('行动结束');
            const isTurnStart = entry.type === 'endTurn' && entry.message.includes('回合开始');
            const isHighlight = isEndTurn || isTurnStart;

            return (
            <div
              key={idx}
              className={`rounded-xl p-3 border ${
                isHighlight
                  ? 'border-accent-primary/30 bg-accent-primary/5'
                  : entry.type === 'endTurn'
                    ? 'border-white/5 bg-white/[0.02]'
                    : 'border-card-border/40 bg-white/[0.03]'
              }`}
            >
              {/* 强调消息直接显示文字 */}
              {isHighlight ? (
                <p className="text-sm font-bold text-accent-primary text-center">{entry.message}</p>
              ) : (
                <>
                  {/* 结构化内容（每行一组 segments） */}
                  {entry.segments ? (
                    <div className="space-y-0.5">
                      {entry.segments.map((segs, lineIdx) => (
                        <LineRenderer key={lineIdx} segments={segs} />
                      ))}
                    </div>
                  ) : (
                    /* 纯文本回退（旧格式日志） */
                    <p className="text-xs text-text-secondary leading-relaxed">{entry.message}</p>
                  )}
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
