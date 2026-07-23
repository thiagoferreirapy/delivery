"use client";
import { useEffect, useState } from "react";

// Fundo em vídeo com crossfade entre vários vídeos. Todos ficam empilhados
// (fixed) tocando em loop; só a opacidade muda. Pode ser controlado por fora
// (prop `active`) para sincronizar com outros elementos (ex.: textos).
export function VideoBackground({
  sources,
  interval = 7000,
  active: controlledActive,
}: {
  sources: string[];
  interval?: number;
  active?: number;
}) {
  const [internal, setInternal] = useState(0);
  const active = controlledActive ?? internal;

  useEffect(() => {
    if (controlledActive != null) return; // controlado por fora
    if (sources.length < 2) return;
    const id = setInterval(() => setInternal((a) => (a + 1) % sources.length), interval);
    return () => clearInterval(id);
  }, [controlledActive, sources.length, interval]);

  return (
    <>
      {sources.map((src, i) => (
        <video
          key={src}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
          className="auth-bg fixed inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: active % sources.length === i ? 1 : 0 }}
        />
      ))}
    </>
  );
}
