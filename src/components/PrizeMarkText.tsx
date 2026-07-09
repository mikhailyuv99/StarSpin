/** Centered bold text on vector prize marks (percent badges, etc.). */
export function PrizeMarkText({
  text,
  size = 7,
}: {
  text: string;
  size?: number;
}) {
  return (
    <text
      x={12}
      y={12.6}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#ffffff"
      fontSize={size}
      fontWeight={800}
      fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
      stroke="#1a1523"
      strokeWidth={0.4}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}
