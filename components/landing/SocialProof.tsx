import { Reveal } from "@/components/motion/Reveal";

const points = [40, 44, 52, 49, 58, 66, 63, 74, 82, 79, 90, 97];

function Sparkline() {
  const w = 260;
  const h = 64;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / (max - min)) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sp)" />
      <path d={line} fill="none" stroke="var(--color-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="3.5" fill="var(--color-mint)" />
    </svg>
  );
}

const journey = [
  { label: "Leads imported", value: "127", tone: "text-graphite" },
  { label: "Unscored & cold", value: "127", tone: "text-graphite" },
  { label: "Hot leads identified", value: "8", tone: "text-mint" },
  { label: "Deals closed", value: "3", tone: "text-ember" },
];

export function SocialProof() {
  return (
    <section id="customers" className="bg-leaf py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-graphite">Score history</p>
          <h2 className="mt-3 font-display text-[26px] font-700 leading-tight text-growth sm:text-[38px]">
            127 unscored leads → 8 hot → 3 closed in 30 days.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="overflow-hidden rounded-xl border border-border-light bg-paper p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[16px] font-600 text-growth">
                  B2B services team · <span className="select-none blur-[3px]">Ridgeline Co.</span>
                </p>
                <p className="mono-data mt-0.5 text-[12px] text-graphite">Pipeline velocity, last 12 weeks</p>
              </div>
              <span className="mono-data rounded-full bg-mint-dim px-3 py-1 text-[12px] font-600 text-mint">
                +142% closed
              </span>
            </div>

            <div className="mt-6">
              <Sparkline />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-light bg-border-light sm:grid-cols-4">
              {journey.map((j) => (
                <div key={j.label} className="bg-paper p-4">
                  <p className={`mono-data text-[26px] font-600 ${j.tone}`}>{j.value}</p>
                  <p className="mt-1 text-[12px] text-graphite">{j.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
