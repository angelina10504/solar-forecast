"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ForecastChart } from "@/components/forecast-chart";
import type { ForecastPoint } from "@/lib/api";

interface InteractiveForecastProps {
  baselineData: ForecastPoint[];
}

export function InteractiveForecast({ baselineData }: InteractiveForecastProps) {
  // Slider state. Defaults to 0 = no adjustment = baseline forecast.
  const [cloudOffset, setCloudOffset] = useState(0);  // -1 .. +1 (fraction)
  const [tempOffset, setTempOffset] = useState(0);    // -15 .. +15 (°C)

  // Compute adjusted forecast every time sliders move.
  // useMemo caches the result so we don't re-compute on unrelated re-renders.
  const adjustedData: ForecastPoint[] = useMemo(() => {
    const cloudFactor = 1 - 0.75 * cloudOffset;
    const tempFactor = 1 - 0.004 * tempOffset;
    const factor = Math.max(0, cloudFactor * tempFactor);  // clamp at 0

    return baselineData.map((p) => ({
      ...p,
      point_mw: p.point_mw * factor,
      p10_mw: p.p10_mw * factor,
      p50_mw: p.p50_mw * factor,
      p90_mw: p.p90_mw * factor,
    }));
  }, [baselineData, cloudOffset, tempOffset]);

  const isAdjusted = cloudOffset !== 0 || tempOffset !== 0;

  // Peak comparison for the status badge
  const baselinePeak = Math.max(...baselineData.map((p) => p.point_mw));
  const adjustedPeak = Math.max(...adjustedData.map((p) => p.point_mw));
  const peakDeltaPct = ((adjustedPeak - baselinePeak) / baselinePeak) * 100;

  return (
    <>
      {/* Forecast chart card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>24-Hour Generation Forecast</CardTitle>
          {isAdjusted && (
            <Badge
              variant="outline"
              className={
                peakDeltaPct < 0
                  ? "text-red-600 border-red-200"
                  : "text-emerald-600 border-emerald-200"
              }
            >
              {peakDeltaPct > 0 ? "+" : ""}
              {peakDeltaPct.toFixed(1)}% peak
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <ForecastChart data={adjustedData} />
        </CardContent>
      </Card>

      {/* What-if controls card */}
      <Card>
        <CardHeader>
          <CardTitle>What-If Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cloud cover slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cloud cover offset</label>
              <span className="text-sm font-mono text-muted-foreground">
                {cloudOffset >= 0 ? "+" : ""}
                {(cloudOffset * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[cloudOffset]}
              onValueChange={(v: number | readonly number[]) =>
                setCloudOffset(Array.isArray(v) ? v[0] : v)
            }
              min={-1}
              max={1}
              step={0.05}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Clear (-100%)</span>
              <span>Baseline (0%)</span>
              <span>Overcast (+100%)</span>
            </div>
          </div>

          {/* Temperature offset slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Temperature offset</label>
              <span className="text-sm font-mono text-muted-foreground">
                {tempOffset >= 0 ? "+" : ""}
                {tempOffset.toFixed(1)} °C
              </span>
            </div>
            <Slider
              value={[tempOffset]}
              onValueChange={(v: number | readonly number[]) =>
                setTempOffset(Array.isArray(v) ? v[0] : v)
            }
              min={-15}
              max={15}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-15°C</span>
              <span>Baseline</span>
              <span>+15°C</span>
            </div>
          </div>

          {/* Reset button */}
          {isAdjusted && (
            <button
              onClick={() => {
                setCloudOffset(0);
                setTempOffset(0);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Reset to baseline
            </button>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
            First-order sensitivity model: 0.75 linear cloud transmission factor,
            -0.4%/°C panel temperature coefficient (PVWatts).
          </p>
        </CardContent>
      </Card>
    </>
  );
}