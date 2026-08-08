interface Trigger {
    id: number;
    text: string;
}
interface TriggerStore {
    triggers: Trigger[];
    addTrigger: (text: string) => void;
    clearTriggers: () => void;
}
export declare const useTriggerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TriggerStore>>;
/** 任意位置调用：在打出卡牌提示框下方显示触发效果，2.2 秒后自动清空 */
export declare function displayTrigger(text: string): void;
export {};
//# sourceMappingURL=triggerStore.d.ts.map