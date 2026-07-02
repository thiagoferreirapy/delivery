"use client";

interface Point {
  lat: number;
  lng: number;
}

// Mapa estilizado (mock) mostrando a posição do entregador e o destino.
export function LiveMap({ me, dest, height = "h-56" }: { me: Point | null; dest: Point | null; height?: string }) {
  const pts = [me, dest].filter(Boolean) as Point[];
  const project = (p: Point) => {
    if (pts.length < 2) return { left: "50%", top: "50%" };
    const lats = pts.map((x) => x.lat);
    const lngs = pts.map((x) => x.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat || 0.01) * 0.4 + 0.002;
    const padLng = (maxLng - minLng || 0.01) * 0.4 + 0.002;
    const x = ((p.lng - (minLng - padLng)) / (maxLng + padLng - (minLng - padLng))) * 100;
    const y = (1 - (p.lat - (minLat - padLat)) / (maxLat + padLat - (minLat - padLat))) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className={`relative ${height} w-full overflow-hidden rounded-2xl border border-black/5 bg-[#EAF0E8]`}>
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(#cfe0cb 1px, transparent 1px), linear-gradient(90deg, #cfe0cb 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      {me && dest && (
        <svg className="absolute inset-0 h-full w-full">
          <line x1={project(me).left} y1={project(me).top} x2={project(dest).left} y2={project(dest).top} stroke="#6E1423" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
        </svg>
      )}
      {dest && <Pin style={project(dest)} label="🏁" ring="bg-ink/10" />}
      {me && <Pin style={project(me)} label="🛵" ring="bg-brand/20 animate-pulse" />}
    </div>
  );
}

function Pin({ style, label, ring }: { style: { left: string; top: string }; label: string; ring: string }) {
  return (
    <div className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center transition-all duration-1000 ease-linear" style={style}>
      <span className={`grid h-9 w-9 place-items-center rounded-full ${ring}`}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-base shadow">{label}</span>
      </span>
    </div>
  );
}
