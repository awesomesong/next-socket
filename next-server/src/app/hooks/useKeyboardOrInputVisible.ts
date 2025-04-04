import { useEffect, useState } from 'react';

export const useKeyboardOrInputVisible = () => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    useEffect(() => {
        const visual = window.visualViewport;

        let lastHeight = visual?.height ?? 0;

        const onResize = () => {
            if (!visual) return;

            const heightDiff = window.innerHeight - visual.height;
            const keyboardLikelyVisible = heightDiff > 100;

            setKeyboardVisible(keyboardLikelyVisible);
            lastHeight = visual.height;
        };

        const handleFocusIn = (e: FocusEvent) => {
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
                setInputFocused(true);

                // ✅ Fallback: visualViewport 작동하지 않는 경우 대비
                if (!visual) {
                    setKeyboardVisible(true);
                }
            }
        };

        const handleFocusOut = () => {
            setInputFocused(false);

            // ✅ Fallback: visualViewport 작동하지 않는 경우 대비
            if (!visual) {
                setKeyboardVisible(false);
            }
        };

        visual?.addEventListener('resize', onResize);
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            visual?.removeEventListener('resize', onResize);
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    return {
        keyboardVisible,
        inputFocused,
    };
};
