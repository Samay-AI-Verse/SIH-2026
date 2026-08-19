import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export function useLenis(enabled) {
    useEffect(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!enabled || reduce)
            return;
        const lenis = new Lenis({
            duration: 1.1,
            smoothWheel: true,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const ticker = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);
        return () => {
            gsap.ticker.remove(ticker);
            lenis.destroy();
        };
    }, [enabled]);
}
