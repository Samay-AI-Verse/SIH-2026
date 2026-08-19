import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";

const steps = [
  { n: "01", title: "REGISTER", copy: "Fill the form with a 6-member squad. No sign-in required." },
  { n: "02", title: "ADD YOUR TEAM", copy: "Open to all branches. At least one female member required." },
  { n: "03", title: "PAY ₹300", copy: "Scan the QR, submit your UTR, and wait for organizer confirmation." },
  { n: "04", title: "CHOOSE YOUR PROBLEM", copy: "After confirmation, lock one statement. Only two teams per problem, updated live." },
  { n: "05", title: "BUILD YOUR SOLUTION", copy: "Hack on 2 & 3 September 2026 at GTMC Nanded." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-peach px-4 py-24 md:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Process" title="How the web is spun" />
        <ol className="mt-14 space-y-5">
          {steps.map((step, index) => (
            <motion.li
              key={step.n}
              className="shine surface-card relative p-6"
              data-reveal
              whileHover={{ x: 10 }}
            >
              <div className="flex flex-wrap items-center gap-6">
                <span className="font-display text-5xl text-spidey comic-pop">{step.n}</span>
                <div>
                  <h3 className="font-display text-3xl text-web">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink/70">{step.copy}</p>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div className="ml-6 mt-4 h-8 w-px bg-linear-to-b from-spidey to-transparent" />
              ) : null}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
