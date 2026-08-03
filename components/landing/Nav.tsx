"use client";

import Link from "next/link";
import { motion } from "motion/react";

const links = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
];

export function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-border-dark bg-growth/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint">
            <span className="font-display text-[15px] font-800 text-growth">L</span>
          </span>
          <span className="font-display text-[16px] font-700 text-leaf">LeadFlow AI</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] font-500 text-fog transition-colors hover:text-leaf"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-[14px] font-500 text-fog transition-colors hover:text-leaf sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-mint px-4 py-2 text-[14px] font-600 text-growth transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_var(--color-mint)]"
          >
            Start free
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
