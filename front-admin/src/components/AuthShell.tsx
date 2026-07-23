"use client";
import type { CSSProperties, ReactNode } from "react";
import { VideoBackground } from "./VideoBackground";

const SCRIM =
  "radial-gradient(120% 80% at 50% 8%, rgba(8,5,4,.72), transparent 60%)," +
  "linear-gradient(180deg, rgba(8,5,4,.7) 0%, rgba(8,5,4,.25) 45%, rgba(8,5,4,.55) 78%, rgba(8,5,4,.92) 100%)";

// Login do admin — responsivo (celular + desktop): vídeo de fundo + scrim quente,
// hero animado e um card centralizado que se ajusta ao conteúdo.
export function AuthShell({
  heading,
  sub,
  eyebrow = "Painel do restaurante",
  title = "Cabana Lanches",
  videos = ["/cabana-bg.mp4", "/lanche.mp4"],
  children,
}: {
  heading: string;
  sub: string;
  eyebrow?: string;
  title?: string;
  videos?: string[];
  children: ReactNode;
}) {
  const words = title.split(" ");
  return (
    <main className="relative min-h-dvh bg-[#0a0605]">
      <VideoBackground sources={videos} />
      <div className="fixed inset-0" style={{ background: SCRIM }} />

      <div className="safe-top relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Hero */}
          <div className="mb-6 text-center">
            <p className="auth-eyebrow text-[11px] font-medium uppercase tracking-[0.38em] text-brand-light">{eyebrow}</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#FFF7EE] drop-shadow-[0_6px_26px_rgba(0,0,0,0.55)]">
              {words.map((w, i) => (
                <span key={i} className="auth-word mr-[0.22em]" style={{ "--i": i } as CSSProperties}>
                  {w}
                </span>
              ))}
            </h1>
            <span className="auth-accent mx-auto mt-3 block h-1 rounded-full bg-brand-light shadow-[0_0_18px_rgba(178,58,72,0.65)]" />
          </div>

          {/* Card */}
          <div className="animate-fade-up rounded-3xl bg-cream/95 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-ink">{heading}</h2>
            <p className="mb-5 mt-0.5 text-sm text-muted">{sub}</p>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
