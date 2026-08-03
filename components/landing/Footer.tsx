export function Footer() {
  return (
    <footer className="border-t border-border-dark bg-growth py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint">
                <span className="font-display text-[15px] font-800 text-growth">L</span>
              </span>
              <span className="font-display text-[16px] font-700 text-leaf">LeadFlow AI</span>
            </div>
            <p className="mt-3 max-w-xs text-[14px] leading-[1.6] text-fog">
              AI lead scoring for sales teams who&rsquo;d rather close than guess.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {[
              { label: "Product", href: "#product" },
              { label: "Pricing", href: "#pricing" },
              { label: "Customers", href: "#customers" },
              { label: "Log in", href: "/login" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-[14px] text-fog transition-colors hover:text-leaf">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-border-dark pt-6 sm:flex-row">
          <span className="mono-data text-[12px] text-fog">© 2026 LeadFlow AI</span>
          <span className="mono-data text-[12px] text-fog">Built for sales teams that ship</span>
        </div>
      </div>
    </footer>
  );
}
