import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ContentSegment, BuffType, BUFF_NAMES } from '@shared/types';
import { getCardImageUrl, getCardByImageId } from '../utils/cardImage';
import { BUFF_DESCRIPTIONS, BUFF_ICON_MAP } from './BuffCollection';
import CardDetail from './CardDetail';

/** 获取 buff 图标 URL */
function getBuffImageUrl(buffType: BuffType): string | null {
  const iconNum = BUFF_ICON_MAP[buffType as string];
  return iconNum ? `/assets/buff/buff${iconNum}.png` : null;
}

interface Props {
  segment: ContentSegment;
  className?: string;
}

/**
 * 可点击的卡牌 / buff 小图（用于战斗记录和触发提示中的富内容段）。
 * 点击后弹出详情，交互参照 BuffBadge：
 * - card 段 → 卡牌图鉴详情（复用 CardDetail）
 * - buff 段 → 图标 + 名称 + 描述弹窗
 * 弹窗通过 Portal 挂到 body，避免受父级 backdrop-filter/transform 影响。
 */
export default function SegmentDetailImage({ segment, className = '' }: Props) {
  const [showDetail, setShowDetail] = useState(false);

  // ===== 卡牌段 =====
  if (segment.type === 'card') {
    const cardId = segment.cardId!;
    const card = getCardByImageId(cardId);

    return (
      <>
        <img
          src={getCardImageUrl(cardId)}
          alt=""
          className={`w-5 h-5 object-contain shrink-0 inline-block align-middle ${card ? 'cursor-pointer hover:scale-110 transition-transform duration-150' : ''} ${className}`}
          style={{ imageRendering: 'pixelated' }}
          onClick={(e) => {
            if (!card) return;
            e.stopPropagation();
            setShowDetail(true);
          }}
        />
        {showDetail && card && createPortal(
          <CardDetail card={card} onClose={() => setShowDetail(false)} />,
          document.body
        )}
      </>
    );
  }

  // ===== buff 段 =====
  if (segment.type === 'buff') {
    const buffType = segment.buffType!;
    const url = getBuffImageUrl(buffType);

    // 无图标的 buff：降级为文本（与旧版行为一致）
    if (!url) {
      return <span className="text-xs text-text-secondary">[{buffType}]</span>;
    }

    const name = BUFF_NAMES[buffType] || buffType;
    const desc = BUFF_DESCRIPTIONS[buffType] || '暂无描述';

    return (
      <>
        <img
          src={url}
          alt=""
          className={`w-5 h-5 object-contain shrink-0 inline-block align-middle cursor-pointer hover:scale-110 transition-transform duration-150 ${className}`}
          style={{ imageRendering: 'pixelated' }}
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
        />
        {showDetail && createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setShowDetail(false); }}
          >
            <div
              className="bg-card-bg border border-card-border rounded-2xl p-4 max-w-[260px] w-full mx-4 shadow-xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 顶部：图标 + 名称 */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-card-bg/50 border border-card-border/50 flex items-center justify-center shrink-0">
                  <img src={url} alt="" className="w-6 h-6 object-contain" style={{ imageRendering: 'pixelated' }} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">{name}</h3>
              </div>

              {/* 描述 */}
              <p className="text-xs text-text-secondary leading-relaxed mb-3">{desc}</p>

              {/* 关闭按钮 */}
              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-1.5 rounded-lg bg-card-bg/50 border border-card-border text-text-secondary text-xs font-medium hover:bg-card-bg/70 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return null;
}
