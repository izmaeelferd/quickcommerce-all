import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const cssColor = (name, alpha = 1) => `rgb(var(--color-${name}) / ${alpha})`;
const PALETTE = ['primary', 'accent', 'success', 'secondary', 'warning', 'error'];

export function TrendChart({ data, xKey, series, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cssColor(PALETTE[i % PALETTE.length], 0.35)} />
              <stop offset="95%" stopColor={cssColor(PALETTE[i % PALETTE.length], 0)} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={cssColor('text', 0.08)} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: cssColor('text', 0.6) }} />
        <YAxis tick={{ fontSize: 12, fill: cssColor('text', 0.6) }} />
        <Tooltip />
        <Legend />
        {series.map((s, i) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={cssColor(PALETTE[i % PALETTE.length])} fill={`url(#g-${s.key})`} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, xKey, series, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={cssColor('text', 0.08)} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: cssColor('text', 0.6) }} />
        <YAxis tick={{ fontSize: 12, fill: cssColor('text', 0.6) }} />
        <Tooltip />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={cssColor(PALETTE[i % PALETTE.length])} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, nameKey, valueKey, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={cssColor(PALETTE[i % PALETTE.length])} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
