import { useEffect } from 'react';

export const useViewportHeight = () => {
    useEffect(() => {
        const setRealHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            console.log('실제 innerHeight:', window.innerHeight); // 예: 812
            console.log('--vh로 설정될 값:', vh); // 예: 8.12

            document.documentElement.style.setProperty('--vh', `${vh}px`);

            // 값 확인 (브라우저에서만 유효함)
            const test = getComputedStyle(document.documentElement).getPropertyValue('--vh');
            console.log('--vh 확인:', test); // 예: "8.12px"
        };


        setRealHeight();
        window.addEventListener('resize', setRealHeight);

        return () => window.removeEventListener('resize', setRealHeight);
    }, []);
};
