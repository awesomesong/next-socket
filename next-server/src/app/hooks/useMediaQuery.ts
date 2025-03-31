import { useState, useEffect } from "react";

const useMediaQuery = (query: string) => {
    const getMatches = () =>
        typeof window !== "undefined" && window.matchMedia(query).matches;

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        if (typeof window !== "undefined") {
        const updateMatch = () => setMatches(getMatches());

        window.addEventListener("resize", updateMatch);
        return () => window.removeEventListener("resize", updateMatch);
        }
    }, []);

    return matches;
};

export default useMediaQuery;
