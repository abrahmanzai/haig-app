"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface AllocationSlice {
  ticker: string;
  value:  number;
  color:  string;
}

interface Props {
  data:       AllocationSlice[];
  totalValue: number;
}

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function CenterLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "inherit" }}>
        Total
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fill: "var(--text-primary)", fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>
        {usd(total)}
      </text>
    </g>
  );
}

export default function AllocationChart({ data, totalValue }: Props) {
  if (data.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", backdropFilter: "blur(12px)" }}
    >
      <div className="mb-4">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Portfolio Allocation</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Equity positions as % of total portfolio value
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="w-full sm:w-52 flex-shrink-0" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="ticker"
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((slice, i) => (
                  <Cell key={i} fill={slice.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [usd(value), name]}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              {/* Center label via custom label prop */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                dataKey="value"
                label={({ cx, cy }: { cx: number; cy: number }) => (
                  <CenterLabel cx={cx} cy={cy} total={totalValue} />
                )}
                labelLine={false}
                isAnimationActive={false}
              >
                <Cell fill="transparent" stroke="transparent" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full grid grid-cols-1 gap-2 min-w-0">
          {data.map((slice) => {
            const pct = totalValue > 0 ? ((slice.value / totalValue) * 100).toFixed(1) : "0.0";
            return (
              <div key={slice.ticker} className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: slice.color }} />
                <span className="text-sm font-bold w-12 flex-shrink-0 tabular-nums" style={{ color: slice.color }}>
                  {slice.ticker}
                </span>
                <div className="flex-1 min-w-0 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: slice.color }}
                  />
                </div>
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {pct}%
                </span>
                <span className="text-xs tabular-nums flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {usd(slice.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
