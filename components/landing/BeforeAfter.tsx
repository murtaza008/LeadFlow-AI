import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const messy = [
  { company: "Vellum & Co", note: "left vm 2x, no reply" },
  { company: "Meridian Cloud", note: "asked for pricing??" },
  { company: "Halcyon Freight", note: "—" },
  { company: "Oaklight Partners", note: "budget approved!!" },
  { company: "Cedar Retail", note: "cold, maybe next Q" },
  { company: "Tessera Group", note: "demo booked" },
];

const scored = [
  { company: "Oaklight Partners", score: 97, tag: "Budget confirmed", value: "$88,400" },
  { company: "Meridian Cloud", score: 94, tag: "High intent", value: "$61,000" },
  { company: "Tessera Group", score: 81, tag: "Demo booked", value: "$33,200" },
  { company: "Cedar Retail", score: 55, tag: "Nurture", value: "$15,600" },
  { company: "Halcyon Freight", score: 48, tag: "Low signal", value: "$9,200" },
  { company: "Vellum & Co", score: 23, tag: "Cold", value: "$4,800" },
];

function dot(score: number) {
  if (score >= 70) return "var(--color-mint)";
  if (score >= 40) return "var(--color-amber)";
  return "var(--color-danger)";
}

export function BeforeAfter() {
  return (
    <section className="bg-leaf py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-graphite">The difference</p>
          <h2 className="mt-3 font-display text-[26px] font-700 leading-tight text-growth sm:text-[38px]">
            Same leads. One list you can actually work.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-graphite">
            Your CRM is a graveyard of half-typed notes and dead prospects. LeadFlow AI reads
            every signal, scores it, and re-sorts your list so the deal worth $88k isn&rsquo;t
            buried under a cold lead from March.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border-light bg-border-light lg:grid-cols-2">
            <div className="bg-paper p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="eyebrow text-graphite">Before · your spreadsheet</span>
                <span className="mono-data text-[11px] text-danger">unsorted</span>
              </div>
              <ul className="space-y-2">
                {messy.map((row) => (
                  <li
                    key={row.company}
                    className="flex items-center justify-between rounded-md border border-border-light bg-leaf/60 px-3 py-2.5"
                  >
                    <span className="text-[14px] font-500 text-growth">{row.company}</span>
                    <span className="mono-data max-w-[45%] truncate text-[12px] text-graphite">{row.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-paper p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="eyebrow text-mint">After · LeadFlow AI</span>
                <span className="mono-data text-[11px] text-mint">sorted by score</span>
              </div>
              <ul className="space-y-2">
                {scored.map((row) => (
                  <li
                    key={row.company}
                    className={cn(
                      "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                      row.score >= 70 ? "border-mint/40 bg-mint-dim/60" : "border-border-light bg-leaf/60",
                    )}
                  >
                    <span
                      className="mono-data flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-600 text-growth"
                      style={{ backgroundColor: `color-mix(in oklab, ${dot(row.score)} 25%, transparent)` }}
                    >
                      {row.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-500 text-growth">{row.company}</p>
                      <p className="mono-data text-[11px] text-graphite">{row.tag}</p>
                    </div>
                    <span className="mono-data shrink-0 text-[13px] font-600 text-growth">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
