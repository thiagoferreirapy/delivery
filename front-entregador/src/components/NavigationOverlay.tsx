"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Overlay semitransparente exibido durante a transição de rota (App Router não
// dá feedback visual entre o clique e a nova página renderizar). Aparece só se a
// navegação passar de ~120ms (evita piscar em rota instantânea) e some sozinho
// assim que o pathname muda.
export function NavigationOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (safety.current) clearTimeout(safety.current);
  };

  // Rota mudou de fato -> esconde
  useEffect(() => {
    clearTimers();
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    function trigger() {
      clearTimers();
      showTimer.current = setTimeout(() => setVisible(true), 120);
      // trava de segurança: nunca deixa o overlay preso
      safety.current = setTimeout(() => setVisible(false), 10000);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el) return;
      const target = el.getAttribute("target");
      if (target && target !== "_self") return;
      if (el.hasAttribute("download")) return;
      const href = el.getAttribute("href");
      if (!href || !href.startsWith("/")) return; // só navegação interna
      const dest = new URL(el.href, window.location.href);
      if (dest.pathname === window.location.pathname) return; // mesma página
      trigger();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[1.5px]"
    >
      <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand" />
    </div>
  );
}
