import { jsx as _jsx } from "react/jsx-runtime";
import { useTriggerStore } from '../store/triggerStore';
import { useSettingsStore } from '../store/settingsStore';
/**
 * 触发效果提示面板
 * 展示在 PlayedCardOverlay 下方，风格与打出提示框一致。
 * 一行展示一个触发效果（如装备触发、buff 触发、伤害结果等）。
 * 不含绝对定位容器，由父组件控制位置。
 */
export default function TriggerEffectPanel() {
    const triggers = useTriggerStore((s) => s.triggers);
    const duration = useSettingsStore((s) => s.cardOverlayDuration);
    // 淡入 400ms，淡出 500ms，淡出延迟 = (总时长 - 400ms) / 1000
    const fadeOutDelay = (duration - 400) / 1000;
    if (triggers.length === 0)
        return null;
    return (_jsx("div", { className: "bg-card-bg/95 backdrop-blur-sm border-2 border-accent-equip rounded-xl px-3 py-1.5 shadow-2xl flex flex-col items-start gap-0.5 mt-1", style: { animation: `cardFlyIn 0.4s ease-out both, cardFadeOut 0.5s ease-in ${fadeOutDelay}s both` }, children: triggers.map((t) => (_jsx("span", { className: "text-xs text-text-secondary whitespace-nowrap", children: t.text }, t.id))) }));
}
//# sourceMappingURL=TriggerEffectPanel.js.map