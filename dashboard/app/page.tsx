import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlantMap } from "@/components/plant-map";
import { DsmCard } from "@/components/dsm-card";
import { InteractiveForecast } from "@/components/interactive-forecast";
import { getForecast } from "@/lib/api";
import Link from "next/link";

export default async function Home() {
  const forecast = await getForecast({ hours: 24 });

  // ... (your existing derived stats: peakPoint, peakMw, peakHour, totalMwh, capacityFactor)

  const peakPoint = forecast.forecasts.reduce((max, p) =>
    p.point_mw > max.point_mw ? p : max
  );
  const peakHour = peakPoint.time.split(" ")[1].substring(0, 5);
  const peakMw = Math.round(peakPoint.point_mw);
  const totalMwh = Math.round(
    forecast.forecasts.reduce((s, p) => s + p.point_mw, 0)
  );
  const capacityFactor = (
    (totalMwh / (forecast.capacity_mw * forecast.forecasts.length)) *
    100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              ☀
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Solar Forecast — Bhadla
              </h1>
              <p className="text-xs text-muted-foreground">
                2,245 MW · Rajasthan, India
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            v1.0
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Top row: Map + Plant details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Plant Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PlantMap />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground">Capacity</div>
                <div className="text-xl font-semibold">
                  {forecast.capacity_mw.toLocaleString()} MW
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="font-mono text-sm">
                  {forecast.location.lat}°N, {forecast.location.lon}°E
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Peak today</div>
                  <div className="text-lg font-semibold">
                    {peakMw.toLocaleString()} MW
                  </div>
                  <div className="text-xs text-muted-foreground">at {peakHour}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expected energy</div>
                  <div className="text-lg font-semibold">
                    {totalMwh.toLocaleString()} MWh
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {capacityFactor}% CF
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive forecast (chart + what-if controls) */}
        <InteractiveForecast baselineData={forecast.forecasts} />

        {/* DSM card on its own full-width row below */}
        <Card>
          <CardHeader>
            <CardTitle>DSM Penalty Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <DsmCard />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-muted-foreground flex justify-between">
          <span>Forecast served by AWS Lambda</span>
          <Link
            href="/methodology"
            className="hover:text-foreground underline decoration-dotted"
          >
            Methodology →
          </Link>
        </div>
      </footer>
    </div>
  );
}