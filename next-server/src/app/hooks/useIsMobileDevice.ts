import { useEffect, useState } from 'react';

const useIsMobileDevice = () => {
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    useEffect(() => {
        if (typeof navigator === 'undefined') return;

        const userAgent = navigator.userAgent || navigator.vendor;

        const isAndroid = /Android/i.test(userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

        if (isAndroid || isIOS) {
            setIsMobileDevice(true);
        }
    }, []);

    return isMobileDevice;
};

export default useIsMobileDevice;
