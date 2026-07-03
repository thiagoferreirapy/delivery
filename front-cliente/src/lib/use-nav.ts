"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Navegação com estado de loading por botão. `pending` fica true até a próxima
// página terminar de renderizar (useTransition + router.push), permitindo mostrar
// um spinner no próprio botão que disparou a navegação.
export function useNav() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string, before?: () => void) => {
    before?.();
    startTransition(() => router.push(href));
  };
  return { navigate, pending };
}
