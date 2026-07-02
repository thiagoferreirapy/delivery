import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...p,
});

export const Icon = {
  dashboard: (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></svg>),
  kitchen: (p: P) => (<svg {...base(p)}><path d="M4 8a8 8 0 0 1 16 0" /><path d="M2 8h20" /><path d="M6 12v8M18 12v8M6 16h12" /></svg>),
  dispatch: (p: P) => (<svg {...base(p)}><path d="M3 7h13v8H3z" /><path d="M16 10h3l2 3v2h-5z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>),
  orders: (p: P) => (<svg {...base(p)}><path d="M5 3v18l2-1.2L9 21l2-1.2L13 21l2-1.2L17 21l2-1.2V3l-2 1.2L15 3l-2 1.2L11 3 9 4.2 7 3Z" /><path d="M8 8h8M8 12h8" /></svg>),
  plus: (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>),
  tag: (p: P) => (<svg {...base(p)}><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>),
  box: (p: P) => (<svg {...base(p)}><path d="M12 3 3 7.5v9L12 21l9-4.5v-9z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" /></svg>),
  users: (p: P) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6" /></svg>),
  truck: (p: P) => (<svg {...base(p)}><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>),
  menu: (p: P) => (<svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>),
  x: (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  logout: (p: P) => (<svg {...base(p)}><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" /><path d="m17 8 4 4-4 4M21 12H9" /></svg>),
  search: (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>),
  camera: (p: P) => (<svg {...base(p)}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.2" /></svg>),
  check: (p: P) => (<svg {...base(p)}><path d="m20 6-11 11-5-5" /></svg>),
  star: (p: P) => (<svg {...base(p)}><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z" /></svg>),
  bell: (p: P) => (<svg {...base(p)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>),
  edit: (p: P) => (<svg {...base(p)}><path d="M4 20h4L20 8l-4-4L4 16z" /><path d="m14 6 4 4" /></svg>),
};
