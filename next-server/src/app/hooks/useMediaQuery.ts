import { useState, useEffect, useCallback } from "react";

const useMediaQuery = (query: string) => {
    const getMatches = useCallback(() =>
        typeof window !== "undefined" && window.matchMedia(query).matches
    ,[query]);

    const [matches, setMatches] = useState(() => getMatches());

    useEffect(() => {
        if (typeof window !== "undefined") {
        const updateMatch = () => setMatches(getMatches());

        window.addEventListener("resize", updateMatch);
        return () => window.removeEventListener("resize", updateMatch);
        }
    }, [getMatches]);

    return matches;
};

export default useMediaQuery;
