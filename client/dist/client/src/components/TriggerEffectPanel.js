import { jsx as _jsx } from "react/jsx-runtime";
import { useTriggerStore } from '../store/triggerStore';
/**
 * 触发效果提示面板
 * 展示在 PlayedCardOverlay 下方，风格与打出提示框一致。
 * 一行展示一个触发效果（如装备触发、buff 触发、伤害结果等）。
 * 不含绝对定位容器，由父组件控制位置。
 */
export default function TriggerEffectPanel() {
    const triggers = useTriggerStore((s) => s.triggers);
    if (triggers.length === 0)
        return null;
    return (_jsx("div", { className: "bg-card-bg/95 backdrop-blur-sm border-2 border-accent-equip rounded-xl px-3 py-1.5 shadow-2xl flex flex-col items-start gap-0.5 mt-1", style: { animation: 'cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in 1.8s both' }, children: triggers.map((t) => (_jsx("span", { className: "text-xs text-text-secondary whitespace-nowrap", children: t.text }, t.id))) }));
}
//# sourceMappingURL=TriggerEffectPanel.js.map