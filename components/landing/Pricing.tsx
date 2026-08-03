import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/mo",
    blurb: "For solo reps testing the water.",
    limits: ["500 leads/mo", "1 team seat", "AI scoring", "Manual follow-ups"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Team",
    price: "$79",
    cadence: "/mo",
    blurb: "For growing sales teams that live in the pipeline.",
    limits: [
      "10,000 leads/mo",
      "5 team seats",
      "Automated follow-ups",
      "Analytics + reports",
      "AI daily focus digest",
    ],
    cta: "Start scoring leads",
    featured: true,
  },
  {
    name: "Agency",
    price: "$199",
    cadence: "/mo",
    blurb: "For agencies running many client pipelines.",
    limits: ["Unlimited leads", "20 team seats", "Custom scoring weights", "Priority support"],
    cta: "Talk to sales",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-growth py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-mint">Pricing</p>
          <h2 className="mt-3 font-display text-[26px] font-700 leading-tight text-leaf sm:text-[38px]">
            Priced per pipeline, not per headache.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-fog">
            Every plan includes AI scoring. Upgrade when your team and lead volume grow.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl bg-storm p-7",
                  t.featured
                    ? "border border-mint shadow-[0_20px_60px_-30px_var(--color-mint)]"
                    : "border border-border-dark",
                )}
                style={t.featured ? { borderTopWidth: 3 } : undefined}
              >
                {t.featured && <p className="eyebrow mb-3 text-mint">Best for growing teams</p>}
                <h3 className="font-display text-[20px] font-700 text-leaf">{t.name}</h3>
                <p className="mt-1 text-[14px] text-fog">{t.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-[40px] font-700 text-leaf">{t.price}</span>
                  <span className="mono-data text-[13px] text-fog">{t.cadence}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {t.limits.map((l) => (
                    <li key={l} className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                      </span>
                      <span className="mono-data text-[13px] text-leaf">{l}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    "mt-7 rounded-md px-5 py-3 text-center text-[15px] font-600 transition-all duration-150 hover:-translate-y-0.5",
                    t.featured
                      ? "bg-mint text-growth hover:shadow-[0_10px_30px_-10px_var(--color-mint)]"
                      : "border border-border-dark text-leaf hover:border-fog",
                  )}
                >
                  {t.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
