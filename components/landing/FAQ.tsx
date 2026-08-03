"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";

const faqs = [
  {
    q: "How does the AI actually score a lead?",
    a: "LeadFlow AI reads the lead's title, company, source, deal value, and notes, then returns a 0–100 score, a hot/warm/cold priority, and 2–4 written reasons — not a black box. You can re-score any lead at any time as new information comes in.",
  },
  {
    q: "Is it really free to run?",
    a: "Yes — Neon Postgres, Google Gemini, and Stripe test mode all have generous free tiers. You can run the entire stack, including AI scoring, without paying for anything.",
  },
  {
    q: "What triggers an automated follow-up?",
    a: "Adding a lead schedules a 24-hour follow-up automatically. Moving a lead to Qualified schedules a proposal follow-up two days out. Both show up on the Follow-ups page and on the lead's own timeline.",
  },
  {
    q: "Can my whole team use one workspace?",
    a: "Yes. Invite teammates as Owner, Admin, or Member from the Team page — everyone sees the same pipeline, scores, and follow-ups, scoped to your workspace.",
  },
  {
    q: "What happens if I don't add a Gemini key?",
    a: "Everything else keeps working — leads, pipeline, follow-ups, analytics. AI scoring and insights simply show an \"AI not configured\" state until you add a free Gemini API key.",
  },
  {
    q: "Can I export or delete my data?",
    a: "Every lead, activity, and follow-up lives in your own Postgres database — query it, export it, or delete it whenever you want. Nothing is locked in.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-y border-border-light bg-leaf py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow text-graphite">FAQ</p>
          <h2 className="mt-3 font-display text-[26px] font-700 leading-tight text-growth sm:text-[38px]">
            Questions, answered.
          </h2>
        </Reveal>
        <div className="divide-y divide-border-light border-y border-border-light">
          {faqs.map((f, i) => (
            <FAQItem key={f.q} item={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ item, index }: { item: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="py-5">
      <button onClick={() => setOpen(!open)} className="group flex w-full items-center justify-between text-left">
        <span className="font-display text-[16px] font-600 text-growth transition-colors group-hover:text-mint">
          {item.q}
        </span>
        <span
          className="mono-data text-xl text-graphite transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="pt-3 text-[14px] leading-[1.65] text-graphite">{item.a}</p>
      </motion.div>
    </div>
  );
}
