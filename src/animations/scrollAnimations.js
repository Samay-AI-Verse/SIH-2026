import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export function bindScrollReveals(root) {
    const ctx = gsap.context(() => {
        gsap.utils.toArray("[data-reveal]").forEach((el, index) => {
            gsap.from(el, {
                y: 40,
                opacity: 0,
                rotate: 1.2,
                duration: 0.85,
                delay: index * 0.03,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 88%",
                },
            });
        });
    }, root);
    return () => ctx.revert();
}
