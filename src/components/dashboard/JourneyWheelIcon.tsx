/** Compact wheel icon for journey preview chips — no pointer, centered. */
export function JourneyWheelIcon({ size = 28 }: { size?: number }) {
  const slices = ["#f5e08e", "#d8ccf5", "#f48fb1", "#a8e6cf", "#b8cfe8", "#f4a89a"];
  const cx = 16;
  const cy = 16;
  const r = 13;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className="journey-wheel-icon"
    >
      <circle cx={cx} cy={cy} r={r + 1.5} fill="#fff" stroke="#0a0a0a" strokeWidth="1.5" />
      {slices.map((color, i) => {
        const start = (i * 360) / slices.length - 90;
        const end = ((i + 1) * 360) / slices.length - 90;
        const startRad = (start * Math.PI) / 180;
        const endRad = (end * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const large = end - start > 180 ? 1 : 0;
        return (
          <path
            key={color}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={color}
            stroke="#0a0a0a"
            strokeWidth="0.6"
          />
        );
      })}
      <circle cx={cx} cy={cy} r="3" fill="#fff" stroke="#0a0a0a" strokeWidth="1" />
    </svg>
  );
}
