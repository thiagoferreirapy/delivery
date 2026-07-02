import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...p,
});

export const IconList = (p: P) => (<svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></svg>);
export const IconMap = (p: P) => (<svg {...base(p)}><path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v14M15 6v14" /></svg>);
export const IconHistory = (p: P) => (<svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></svg>);
export const IconUser = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
export const IconMapPin = (p: P) => (<svg {...base(p)}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);
export const IconCamera = (p: P) => (<svg {...base(p)}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.2" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m20 6-11 11-5-5" /></svg>);
export const IconChevronLeft = (p: P) => (<svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>);
export const IconPhone = (p: P) => (<svg {...base(p)}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>);
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconPower = (p: P) => (<svg {...base(p)}><path d="M12 4v8" /><path d="M6.3 7.3a8 8 0 1 0 11.4 0" /></svg>);
export const IconLogout = (p: P) => (<svg {...base(p)}><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" /><path d="m17 8 4 4-4 4M21 12H9" /></svg>);
export const IconMoney = (p: P) => (<svg {...base(p)}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>);
