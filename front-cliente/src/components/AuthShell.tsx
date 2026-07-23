"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { VideoBackground } from "./VideoBackground";

const SCRIM =
  "radial-gradient(120% 80% at 50% 8%, rgba(8,5,4,.72), transparent 60%)," +
  "linear-gradient(180deg, rgba(8,5,4,.68) 0%, rgba(8,5,4,.15) 40%, rgba(8,5,4,.42) 72%, rgba(8,5,4,.92) 100%)";

export interface Slide {
  eyebrow: string;
  title: string;
  tagline: string;
}

// Cada slide = um vídeo + seu texto. A tela alterna vídeo e texto em sincronia.
const DEFAULT_SLIDES: Slide[] = [
  {
    eyebrow: "Cabana Lanches",
    title: "Seus lanches na palma da mão",
    tagline: "Peça em segundos e acompanhe sua entrega em tempo real.",
  },
  {
    eyebrow: "Cardápio",
    title: "Variedade pra todo gosto",
    tagline: "Lanches, porções, doces e bebidas para todos os momentos.",
  },
];
const DEFAULT_VIDEOS = ["/cabana-bg.mp4", "/lanche.mp4"];

export function AuthShell({
  heading,
  sub,
  slides = DEFAULT_SLIDES,
  videos = DEFAULT_VIDEOS,
  interval = 7000,
  children,
}: {
  heading: string;
  sub: string;
  slides?: Slide[];
  videos?: string[];
  interval?: number;
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [slides.length, interval]);

  const slide = slides[active % slides.length]!;
  const words = slide.title.split(" ");

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#0a0605]">
      {/* Vídeos (crossfade, sincronizado com os textos) */}
      <VideoBackground sources={videos} active={active} />
      <div className="fixed inset-0" style={{ background: SCRIM }} />

      {/* Hero animado — re-anima a cada troca de slide (key={active}) */}
      <div
        key={active}
        className="safe-top relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      >
        <p className="auth-eyebrow text-[11px] font-medium uppercase tracking-[0.38em] text-brand-light">{slide.eyebrow}</p>
        <h1 className="mt-3 font-display text-[2.4rem] font-bold leading-[1.04] tracking-tight text-[#FFF7EE] drop-shadow-[0_6px_26px_rgba(0,0,0,0.55)]">
          {words.map((w, i) => (
            <span key={i} className="auth-word mr-[0.22em]" style={{ "--i": i } as CSSProperties}>
              {w}
            </span>
          ))}
        </h1>
        <span className="auth-accent mt-4 block h-1 rounded-full bg-brand-light shadow-[0_0_18px_rgba(178,58,72,0.65)]" />
        <p className="auth-sub mt-4 max-w-[32ch] text-sm leading-relaxed text-[#F0E7DC]/90 drop-shadow">{slide.tagline}</p>
      </div>

      {/* Folha do formulário */}
      <div className="animate-fade-up relative rounded-t-[2rem] bg-cream px-6 pb-8 pt-7 shadow-[0_-12px_34px_rgba(0,0,0,0.4)]">
        <h2 className="font-display text-2xl font-bold text-ink">{heading}</h2>
        <p className="mb-5 mt-0.5 text-sm text-muted">{sub}</p>
        {children}
      </div>
    </main>
  );
}
