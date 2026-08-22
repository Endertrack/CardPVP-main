import { CardDef } from '@shared/types';
import { CARDS } from '@shared/constants';

/** 从 card.id 中提取卡牌编号，支持 card_1、debug_card_1_xxx、brew_card_1_xxx 等格式 */
export function getCardImageNum(cardId: string): string {
  const match = cardId.match(/card_(\d+)/);
  return match ? match[1] : '0';
}

export function getCardImageUrl(cardId: string): string {
  const num = getCardImageNum(cardId);
  const ext = num === '21' ? '.gif' : '.png';
  return `/assets/item/${num}${ext}`;
}

/**
 * 根据任意 cardId 查找卡牌模板（图鉴数据）。
 * 兼容 card_5、card_5_0（手牌实例）、debug_card_5_xxx、brew_card_5_xxx 等格式。
 * 找不到（编号非法/超出图鉴范围）时返回 undefined。
 */
export function getCardByImageId(cardId: string): CardDef | undefined {
  const num = getCardImageNum(cardId);
  if (!num || num === '0') return undefined;
  return CARDS.find(c => c.id === `card_${num}`) as CardDef | undefined;
}
