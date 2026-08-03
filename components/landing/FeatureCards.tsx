import { Reveal } from "@/components/motion/Reveal";

function ScoringMock() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border-light bg-leaf/60 p-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border-light)" strokeWidth="4" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--color-mint)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset="6"
          />
        </svg>
        <span className="mono-data absolute text-[15px] font-600 text-growth">94</span>
      </div>
      <div className="space-y-1.5">
        <span className="mono-data block rounded bg-mint-dim px-1.5 py-0.5 text-[10px] font-600 text-mint">
          budget-confirmed
        </span>
        <span className="mono-data block rounded bg-ember-dim px-1.5 py-0.5 text-[10px] font-600 text-ember">
          high-intent
        </span>
      </div>
    </div>
  );
}

function PipelineMock() {
  const cols = [3, 2, 4, 2];
  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-border-light bg-leaf/60 p-4">
      {cols.map((n, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-border-light" />
          {Array.from({ length: n }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded-sm border border-border-light"
              style={{ backgroundColor: i === 2 ? "var(--color-mint-dim)" : "var(--color-paper)" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function FollowupMock() {
  return (
    <div className="space-y-2 rounded-lg border border-border-light bg-leaf/60 p-4">
      <div className="mono-data text-[10px] text-graphite">RE: Pricing for Meridian Cloud</div>
      <div className="h-1.5 w-11/12 rounded-full bg-border-light" />
      <div className="h-1.5 w-full rounded-full bg-border-light" />
      <div className="h-1.5 w-8/12 rounded-full bg-border-light" />
      <div className="mt-2 inline-flex rounded-md bg-mint px-2 py-1 text-[10px] font-600 text-growth">
        Send follow-up
      </div>
    </div>
  );
}

function ReportsMock() {
  const bars = [40, 68, 52, 84, 60, 92];
  return (
    <div className="flex h-[88px] items-end gap-2 rounded-lg border border-border-light bg-leaf/60 p-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: `${h}%`, backgroundColor: i === 5 ? "var(--color-ember)" : "var(--color-mint)" }}
        />
      ))}
    </div>
  );
}

const features = [
  {
    title: "AI Scoring",
    body: "Every lead scored 0–100 from title, source, deal size and engagement — with the reasons written out.",
    mock: <ScoringMock />,
  },
  {
    title: "Pipeline View",
    body: "Drag-and-drop kanban that shows deal value and score per stage, so you always know what's really in play.",
    mock: <PipelineMock />,
  },
  {
    title: "Auto Follow-ups",
    body: "The moment a lead is added — or crosses into Qualified — LeadFlow schedules the next touch automatically.",
    mock: <FollowupMock />,
  },
  {
    title: "Team Reports",
    body: "Funnel, source mix, score distribution and win-rate trend — mapped to the metrics that predict a closed quarter.",
    mock: <ReportsMock />,
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="bg-leaf pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="h-full rounded-xl border border-border-light bg-paper p-6">
                {f.mock}
                <h3 className="mt-5 font-display text-[18px] font-600 text-growth">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-graphite">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
