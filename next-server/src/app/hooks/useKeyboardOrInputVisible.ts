import { useEffect, useState } from 'react';

export const useKeyboardOrInputVisible = () => {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    useEffect(() => {
        const visual = window.visualViewport;

        const onResize = () => {
        if (!visual) return;
            const keyboardShown = window.innerHeight - visual.height > 100;
            setKeyboardVisible(keyboardShown);
        };

        const handleFocusIn = (e: FocusEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            setInputFocused(true);
        }
        };

        const handleFocusOut = () => {
            setInputFocused(false);
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
