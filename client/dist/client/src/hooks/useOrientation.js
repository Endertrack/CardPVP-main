import { useState, useEffect } from 'react';
/**
 * 检测屏幕方向：横屏 or 竖屏
 * 横屏 = width > height
 */
export function useIsLandscape() {
    const [isLandscape, setIsLandscape] = useState(() => {
        if (typeof window === 'undefined')
            return false;
        return window.innerWidth > window.innerHeight;
    });
    useEffect(() => {
        let ticking = false;
        const handler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsLandscape(window.innerWidth > window.innerHeight);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('resize', handler);
        window.addEventListener('orientationchange', handler);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('orientationchange', handler);
        };
    }, []);
    return isLandscape;
}
//# sourceMappingURL=useOrientation.js.map