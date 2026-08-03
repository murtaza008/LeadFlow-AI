"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PipelineDemo } from "./PipelineDemo";

const ease = [0.16, 1, 0.3, 1] as const;

function stagger(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.05 + i * 0.08, duration: 0.38, ease },
  };
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-growth pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 text-center">
        <motion.p {...stagger(0)} className="eyebrow text-mint">
          AI-Powered Lead Scoring
        </motion.p>
        <motion.h1
          {...stagger(1)}
          className="mt-5 max-w-3xl font-display text-[36px] font-700 leading-[1.05] tracking-tight text-leaf sm:text-[60px]"
        >
          Know which leads will close.
          <br className="hidden sm:block" /> Before you call.
        </motion.h1>
        <motion.p {...stagger(2)} className="mt-6 max-w-xl text-[16px] leading-[1.65] text-fog">
          Stop burning hours on cold prospects. LeadFlow AI scores every lead 0–100, surfaces the
          ones ready to buy, and schedules the follow-up automatically — so your reps only chase
          deals that actually close.
        </motion.p>
        <motion.div {...stagger(3)} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-md bg-mint px-6 py-3 text-[15px] font-600 text-growth transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_var(--color-mint)]"
          >
            Start scoring leads
          </Link>
          <a
            href="#product"
            className="rounded-md border border-border-dark px-6 py-3 text-[15px] font-600 text-leaf transition-all duration-150 hover:-translate-y-0.5 hover:border-fog"
          >
            See it live
          </a>
        </motion.div>
        <motion.div
          {...stagger(4)}
          className="mt-8 flex items-center gap-4 font-mono text-[11px] text-fog"
        >
          <span>FULLY FREE STACK</span>
          <span className="text-border-dark">·</span>
          <span>NO CREDIT CARD</span>
          <span className="text-border-dark">·</span>
          <span>5-MIN SETUP</span>
        </motion.div>

        <div className="mt-16 flex w-full justify-center" id="product">
          <PipelineDemo />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to bottom, transparent, var(--color-leaf))" }}
      />
    </section>
  );
}
