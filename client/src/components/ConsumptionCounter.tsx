import { PlayerState } from '@shared/types';
import { useT } from '../i18n/i18n';

interface Props {
  player: PlayerState;
}

// 方格：小圆角 + 1px 深色边框（边框色比格色深一档）
const CELL = 'w-3.5 h-3.5 rounded-sm border shrink-0';

// 底色 / 深边框 / 斜纹线色（45° 纹理，与凋零方案同风格）
const BASE = { orange: '#c98910', green: '#27ae60', red: '#c0392b', blue: '#2980b9' };
const DEEP = { orange: '#8a5e07', green: '#177a42', red: '#8f2a20', blue: '#1b5a80' };
const LINE = {
  green: 'rgba(23, 122, 66, 0.75)',
  red: 'rgba(143, 42, 32, 0.75)',
  blue: 'rgba(27, 90, 128, 0.75)',
};

type ShadeColor = keyof typeof LINE;
interface Cell {
  /** 橙色行动/锦囊底格 */
  orange: boolean;
  /** 叠加阴影色（回血/攻击/冰原互通） */
  shade?: ShadeColor;
}

/**
 * 出牌次数提示（参考血条凋零方案）：
 * - 橙色实格：剩余行动/锦囊次数，消耗即减格
 * - 回血（绿）/攻击（红）剩余次数以斜纹阴影叠加到橙格上；
 *   橙格不足时独立显示在其应有位置（条尾顺延）
 * - 装备冰原（场地）：回血/攻击互通，阴影统一为蓝色
 */
export default function ConsumptionCounter({ player }: Props) {
  const t = useT();

  const actionLimit = 5 + (player.actionLimitBonus || 0);
  const actionRemaining = Math.max(0, actionLimit - (player.actionStrategyCountThisTurn || 0));
  const healRemaining = Math.max(0, 1 - (player.healCountThisTurn || 0));
  const attackRemaining = Math.max(0, 1 - (player.attackCountThisTurn || 0));

  // 冰原（场地槽）：回血/攻击次数互通
  const frost = player.equipment?.field?.name === '冰原';

  // 构建格子：橙格打底，阴影按 ➊绿 ➋红（冰原为蓝色）从第 1 格起叠加，不足时顺延至条尾
  const cells: Cell[] = Array.from({ length: actionRemaining }, () => ({ orange: true }));
  const putShade = (idx: number, color: ShadeColor) => {
    if (idx < cells.length) cells[idx].shade = color;
    else cells.push({ orange: false, shade: color });
  };
  if (frost) {
    const shared = healRemaining + attackRemaining;
    for (let i = 0; i < shared; i++) putShade(i, 'blue');
  } else {
    if (healRemaining > 0) putShade(0, 'green');
    if (attackRemaining > 0) putShade(healRemaining > 0 ? 1 : 0, 'red');
  }

  return (
    <div className="flex items-center gap-1">
      {cells.map((c, i) => {
        const shadeColor = c.shade;
        const style = c.orange
          ? shadeColor
            ? { border: `1px solid ${DEEP[shadeColor]}`, background: `repeating-linear-gradient(45deg, ${LINE[shadeColor]} 0 2px, transparent 2px 4px), ${BASE.orange}` }
            : { border: `1px solid ${DEEP.orange}`, background: BASE.orange }
          : shadeColor
            ? { border: `1px solid ${DEEP[shadeColor]}`, background: `repeating-linear-gradient(45deg, ${LINE[shadeColor]} 0 2px, transparent 2px 4px), rgba(0,0,0,0.06)` }
            : undefined;
        return (
          <div
            key={i}
            className={CELL}
            style={style}
            title={shadeColor === 'blue'
              ? t('剩余回血/攻击次数（冰原：互通）', 'Heal/attack plays left (Frost Field: shared)')
              : shadeColor === 'green'
                ? t('剩余回血次数', 'Heal plays left')
                : shadeColor === 'red'
                  ? t('剩余攻击次数', 'Attack plays left')
                  : t('剩余行动/锦囊次数', 'Action/strategy plays left')}
          />
        );
      })}
    </div>
  );
}
