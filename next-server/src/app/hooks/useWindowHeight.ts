// hooks/useWindowHeight.ts
import { useEffect, useState } from "react";

const useWindowHeight = () => {
    const [height, setHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 0);

    useEffect(() => {
        const handleResize = () => {
        setHeight(window.innerHeight); // 키보드가 올라오면 줄어든 높이로 갱신됨
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // 초기 실행

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return height;
};

export default useWindowHeight;
