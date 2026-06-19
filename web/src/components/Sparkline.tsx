// Leichtgewichtige SVG-Sparkline (ohne Chart-Abhängigkeit) für den
// Stimmungsverlauf. Skaliert auf 1..10, füllt sanft mit Akzentgrün.
export function Sparkline({
  values,
  height = 64,
}: {
  values: number[];
  height?: number;
}) {
  if (values.length < 2) return null;

  const W = 300;
  const H = height;
  const PAD = 6;
  const min = 1;
  const max = 10;
  const n = values.length;
  const dx = (W - PAD * 2) / (n - 1);

  const pts = values.map((v, i) => {
    const x = PAD + i * dx;
    const y = PAD + (H - PAD * 2) * (1 - (v - min) / (max - min));
    return [x, y] as const;
  });

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${pts[n - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  const last = pts[n - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      role="img"
      aria-label="Stimmungsverlauf der letzten Einträge"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--green-deep)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--green-deep)" />
    </svg>
  );
}
