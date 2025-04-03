import { useEffect } from 'react';

export const useViewportHeight = () => {
    useEffect(() => {
        const setRealHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            console.log('@@vh', vh);
        };


        setRealHeight();
        window.addEventListener('resize', setRealHeight);

        return () => window.removeEventListener('resize', setRealHeight);
    }, []);
};
