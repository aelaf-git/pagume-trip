export default function LineChart({ data, height = 200, lineColor = "var(--color-brand-500)" }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 16, bottom: 32, left: 16 };
  const chartWidth = data.length * 64 + padding.left + padding.right;
  const chartHeight = height + padding.top + padding.bottom;
  const chartAreaWidth = chartWidth - padding.left - padding.right;

  const points = data.map((item, i) => {
    const x = padding.left + (i * chartAreaWidth) / (data.length - 1 || 1);
    const y = padding.top + height - (item.value / maxValue) * height;
    return { x, y, label: item.label, value: item.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + height} L ${points[0].x} ${padding.top + height} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ maxWidth: chartWidth }}>
        <path d={areaPath} fill={lineColor} className="opacity-10" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={lineColor} strokeWidth="2.5" className="transition-all" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="10"
            >
              {p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : p.value}
            </text>
            <text
              x={p.x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize="11"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
