import { Award, Lightbulb, Medal, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";

const features = [
  { icon: Trophy, title: "Exciting Prize Pool", copy: "Win exciting prizes for nationally ranked solutions.", color: "text-spidey" },
  { icon: Award, title: "Government Initiative", copy: "An initiative by the Ministry of Education, Government of India.", color: "text-web" },
  { icon: Lightbulb, title: "Innovate For Impact", copy: "Solve real-world problems that can change communities.", color: "text-gold" },
  { icon: Medal, title: "Certificates & Recognition", copy: "Earn participation and winning certificates from SIH 2026.", color: "text-spidey" },
];

export function Features() {
  return (
    <section className="relative px-4 py-24 md:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Why swing in" title="With great code comes great impact" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="surface-card p-6"
              data-reveal
              whileHover={{ y: -8, rotate: -1 }}
              transition={{ delay: index * 0.05 }}
            >
              <feature.icon className={`mb-4 ${feature.color}`} />
              <h3 className="font-display text-2xl text-web">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/70">{feature.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
