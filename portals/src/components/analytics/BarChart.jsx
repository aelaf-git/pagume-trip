export default function BarChart({ data, height = 200, barColor = "var(--color-brand-500)" }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 16, bottom: 32, left: 16 };
  const chartWidth = data.length * 48 + padding.left + padding.right;
  const chartHeight = height + padding.top + padding.bottom;
  const barWidth = 28;
  const chartAreaWidth = chartWidth - padding.left - padding.right;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ maxWidth: chartWidth }}>
        {data.map((item, i) => {
          const x = padding.left + (i * chartAreaWidth) / data.length + (chartAreaWidth / data.length - barWidth) / 2;
          const barHeight = (item.value / maxValue) * height;
          const y = padding.top + height - barHeight;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={barColor}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize="10"
              >
                {item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                className="fill-gray-400"
                fontSize="11"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
