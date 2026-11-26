import { STAGES, STAGE_LABEL } from "@/lib/analytics-calc";
import { SCENE_LEADS } from "./scene/leads";

const HEAT = (score: number) =>
  score >= 70 ? "var(--hot)" : score >= 40 ? "var(--accent)" : "var(--cold)";

/**
 * Still image of the story's pipeline stage: the demo workspace's leads in
 * their five columns. Shown in the server HTML, until the interactive scene
 * mounts, and without JavaScript.
 */
export function SceneFallback() {
  const colW = 112;
  return (
    <svg
      viewBox="0 0 600 420"
      role="img"
      aria-label="The demo workspace's 35 leads in five pipeline columns: New, Contacted, Qualified, Won and Lost"
      className="h-full w-full"
    >
      {STAGES.map((stage, c) => {
        const leads = SCENE_LEADS.filter((l) => l.status === stage).sort((a, b) => b.score - a.score);
        const x = 20 + c * (colW + 4);
        return (
          <g key={stage}>
            <text x={x + 4} y="38" fontSize="10" fontFamily="var(--font-mono)" fill="var(--fg-muted)">
              {STAGE_LABEL[stage].toUpperCase()} · {leads.length}
            </text>
            {leads.map((l, k) => (
              <g key={l.id}>
                <rect x={x} y={52 + k * 42} width={colW - 6} height="34" rx="6" fill="var(--surface)" stroke="var(--border-strong)" />
                <rect x={x} y={52 + k * 42} width="4" height="34" rx="2" fill={HEAT(l.score)} />
                <text x={x + 11} y={73 + k * 42} fontSize="10.5" fontWeight="600" fill="var(--fg)">
                  {l.name.split(" ")[0]}
                </text>
                <text x={x + colW - 14} y={73 + k * 42} fontSize="10" textAnchor="end" fontFamily="var(--font-mono)" fill="var(--fg-muted)">
                  {l.score}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
