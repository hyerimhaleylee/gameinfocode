"use client";

interface Props {
  stats: Record<string, number>;
  color?: "cyan" | "purple" | "blue";
}

const COLOR_MAP = {
  cyan: { stroke: "rgba(0,245,255", fill: "rgba(0,245,255" },
  purple: { stroke: "rgba(168,85,247", fill: "rgba(168,85,247" },
  blue: { stroke: "rgba(59,130,246", fill: "rgba(59,130,246" },
};

export default function MiniRadarChart({ stats, color = "cyan" }: Props) {
  const SIZE = 128;
  const CENTER = SIZE / 2;
  const RADIUS = 46;
  const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];

  const keys = Object.keys(stats);
  const values = Object.values(stats);
  const n = keys.length;
  const { stroke, fill } = COLOR_MAP[color];

  const getAngle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
  const getPoint = (angle: number, val: number) => ({
    x: CENTER + (val / 100) * RADIUS * Math.cos(angle),
    y: CENTER + (val / 100) * RADIUS * Math.sin(angle),
  });

  const gridPts = (level: number) =>
    keys.map((_, i) => {
      const p = getPoint(getAngle(i), 100 * level);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPts = values
    .map((v, i) => {
      const p = getPoint(getAngle(i), v);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const filterId = `mini-glow-${color}`;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="overflow-visible"
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid polygons */}
      {GRID_LEVELS.map((level, li) => (
        <polygon
          key={li}
          points={gridPts(level)}
          fill="none"
          stroke={`${stroke}, ${0.08 + li * 0.04})`}
          strokeWidth={level === 1 ? 0.8 : 0.5}
        />
      ))}

      {/* Axis lines */}
      {keys.map((_, i) => {
        const end = getPoint(getAngle(i), 100);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke={`${stroke}, 0.1)`}
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPts}
        fill={`${fill}, 0.18)`}
        stroke={`${stroke}, 0.85)`}
        strokeWidth="1.5"
        filter={`url(#${filterId})`}
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const p = getPoint(getAngle(i), v);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill={`${stroke}, 1)`}
            filter={`url(#${filterId})`}
          />
        );
      })}
    </svg>
  );
}
