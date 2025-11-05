import { useState, useEffect } from "react";

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const mediaQuery = window.matchMedia(query);
        
        // ✅ 초기값 설정
        setMatches(mediaQuery.matches);
        
        // ✅ MediaQueryList의 change 이벤트 리스너 사용 (resize보다 효율적)
        const updateMatch = (e: MediaQueryListEvent) => setMatches(e.matches);
        
        // ✅ addEventListener 사용 (addListener는 deprecated)
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", updateMatch);
            return () => mediaQuery.removeEventListener("change", updateMatch);
        } else {
            // ✅ fallback for older browsers
            mediaQuery.addListener(updateMatch);
            return () => mediaQuery.removeListener(updateMatch);
        }
    }, [query]);

    return matches;
};

export default useMediaQuery;
