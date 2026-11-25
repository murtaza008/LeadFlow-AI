import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Try it" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "Questions" },
  { href: "/signup", label: "Create a workspace" },
  { href: "/login", label: "Sign in" },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6">
      <div className="flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-[13.5px] text-fg-muted">
            A sales CRM that scores every lead, picks who to call today and books the follow-ups.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13.5px] text-fg-muted transition-colors hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-10 font-mono text-[11.5px] text-fg-muted">
        © 2026 LeadFlow AI · a portfolio project · Next.js, Neon Postgres, Google Gemini
      </p>
    </footer>
  );
}
