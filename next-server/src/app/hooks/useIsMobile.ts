import { useMemo } from 'react';

const useIsMobile = () => {
    return useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }, []);
};

export default useIsMobile;
