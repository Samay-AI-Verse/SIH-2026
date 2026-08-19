import { useEffect, useState } from "react";
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const mobile = window.matchMedia("(max-width: 768px)");
        const sync = () => {
            setReduced(motion.matches);
            setIsMobile(mobile.matches);
        };
        sync();
        motion.addEventListener("change", sync);
        mobile.addEventListener("change", sync);
        return () => {
            motion.removeEventListener("change", sync);
            mobile.removeEventListener("change", sync);
        };
    }, []);
    return { reduced, isMobile, simplify: reduced || isMobile };
}
