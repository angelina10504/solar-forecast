"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ForecastPoint } from "@/lib/api";

interface ForecastChartProps {
  data: ForecastPoint[];
}

// Format "2026-05-18 12:00:00" → "12:00"
function formatHour(time: string): string {
  return time.split(" ")[1].substring(0, 5);
}

// Custom tooltip showing all four values
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ForecastPoint }>;
  label?: string;
})  {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-xs">
      <div className="font-medium mb-1">{label}</div>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Forecast</span>
          <span className="font-mono font-medium">
            {point.point_mw.toFixed(0)} MW
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">P10 - P90</span>
          <span className="font-mono">
            {point.p10_mw.toFixed(0)} – {point.p90_mw.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ForecastChart({ data }: ForecastChartProps) {
  // Reshape data: recharts needs "hour" as a separate field for x-axis
  const chartData = data.map((d) => ({
    ...d,
    hour: formatHour(d.time),
  }));

  return (
  <div className="w-full" style={{ height: 360 }}>
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            label={{
              value: "MW",
              angle: -90,
              position: "insideLeft",
              offset: 15,
              style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Lower bound (transparent fill — anchors the band start) */}
          <Area
            type="monotone"
            dataKey="p10_mw"
            stroke="none"
            fill="transparent"
            stackId="band"
          />
          {/* Upper bound (the difference filled in orange) */}
          <Area
            type="monotone"
            dataKey={(d) => d.p90_mw - d.p10_mw}
            stroke="none"
            fill="hsl(25 95% 53%)"
            fillOpacity={0.18}
            stackId="band"
            name="P10-P90 range"
          />
          {/* Point forecast line */}
          <Line
            type="monotone"
            dataKey="point_mw"
            stroke="hsl(25 95% 53%)"
            strokeWidth={2}
            dot={false}
            name="Forecast"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}