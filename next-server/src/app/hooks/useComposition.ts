import { useRef, useCallback } from 'react';

export default function useComposition() {
    const isComposingRef = useRef(false);

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
    }, []);

    const isComposing = () => isComposingRef.current;

    return {
        isComposing,
        handleCompositionStart,
        handleCompositionEnd
    };
}