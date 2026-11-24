/**
 * Press feedback for anything marked `data-press`: a quick 0.97 scale run
 * with the Web Animations API, outside React, and only for pointer input
 * (keyboard activation stays instant). One delegated listener for the app.
 */
const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function installPressFeedback(): () => void {
  function onDown(e: PointerEvent) {
    if (e.button !== 0 || reduced()) return;
    const target = e.target as Element | null;
    const el = target?.closest<HTMLElement>("[data-press]");
    if (!el || el.matches(":disabled, [aria-disabled='true']")) return;

    const press = el.animate([{ transform: "scale(1)" }, { transform: "scale(0.97)" }], {
      duration: 110,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fill: "forwards",
    });

    const release = () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      press.cancel();
      el.animate([{ transform: "scale(0.97)" }, { transform: "scale(1)" }], {
        duration: 220,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }

  document.addEventListener("pointerdown", onDown, { passive: true });
  return () => document.removeEventListener("pointerdown", onDown);
}
