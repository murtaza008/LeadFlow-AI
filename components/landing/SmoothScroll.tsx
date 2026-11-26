"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Inertial scrolling for the landing page only. Off with reduced motion and on
 * touch devices (native momentum is better there). In-page anchor links are
 * routed through Lenis so they glide too.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto"; // Lenis animates; CSS smooth scroll would fight it

    const lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(2, -10 * t), anchors: { offset: -64 } });
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      html.style.scrollBehavior = prev;
    };
  }, []);
  return null;
}
