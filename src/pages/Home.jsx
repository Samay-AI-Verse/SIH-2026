import { useEffect } from "react";
import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { About } from "../components/About";
import { Features } from "../components/Features";
import { Timeline } from "../components/Timeline";
import { ProblemExplorer } from "../components/ProblemExplorer";
import { HowItWorks } from "../components/HowItWorks";
import { Rules } from "../components/Rules";
import { FAQ } from "../components/FAQ";
import { CTA } from "../components/CTA";
import { Contact } from "../components/Contact";

export function Home() {
  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <Timeline />
      <Features />
      <ProblemExplorer compact />
      <HowItWorks />
      <Rules />
      <FAQ />
      <CTA />
      <Contact />
    </>
  );
}
