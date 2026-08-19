import gsap from "gsap";
export function animateHero(root) {
    const ctx = gsap.context(() => {
        gsap.from("[data-hero-item]", {
            y: 28,
            opacity: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
        });
    }, root);
    return () => ctx.revert();
}
