interface Notification {
    id: number;
    text: string;
}
interface NotificationStore {
    notifications: Notification[];
    addNotification: (text: string) => void;
    removeNotification: (id: number) => void;
}
export declare const useNotificationStore: import("zustand").UseBoundStore<import("zustand").StoreApi<NotificationStore>>;
/** 任意位置调用：屏幕上方弹出提示，3 秒后消失，多条自动向下堆叠（上限3条） */
export declare function displayMessage(text: string): void;
export {};
//# sourceMappingURL=notificationStore.d.ts.map