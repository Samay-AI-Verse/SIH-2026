import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQ_ITEMS } from "../utils/constants";
import { SectionHeading } from "./ui/SectionHeading";

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section-mint px-4 py-24 md:px-6">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Support" title="Frequently asked questions" />
        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <article key={item.q} className="overflow-hidden comic-panel">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gold/20"
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
              >
                <span className="pr-6 font-semibold text-ink">{item.q}</span>
                <ChevronDown className={`shrink-0 text-spidey transition duration-300 ${open === index ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === index ? (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-5 pb-5 text-sm leading-7 text-ink/70"
                  >
                    {item.a}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
