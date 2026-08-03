import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

export function CTA() {
  return (
    <section className="bg-leaf py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-growth p-10 text-center text-leaf sm:p-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, var(--color-mint) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--color-ember) 0%, transparent 40%)",
              }}
            />
            <div className="relative">
              <p className="eyebrow mb-5 text-mint">Ready when you are</p>
              <h2 className="font-display text-[32px] font-700 leading-[1.1] sm:text-[42px]">
                Stop guessing which lead to call{" "}
                <span className="italic font-500 text-mint">next</span>.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[16px] text-fog">
                Free forever to start. Your first scored pipeline in five minutes.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-md bg-mint px-6 py-3 text-[15px] font-600 text-growth transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_var(--color-mint)]"
                >
                  Start free →
                </Link>
                <a
                  href="#pricing"
                  className="px-6 py-3 text-[15px] font-600 text-fog transition-colors hover:text-leaf"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
