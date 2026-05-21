// API client for the solar forecast Lambda endpoint.

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ---- Types matching the Lambda response shape ----

export interface ForecastPoint {
  time: string;          // "2026-05-18 12:00:00"
  point_mw: number;
  p10_mw: number;
  p50_mw: number;
  p90_mw: number;
}

export interface ForecastResponse {
  location: { lat: number; lon: number };
  capacity_mw: number;
  hours_ahead: number;
  forecasts: ForecastPoint[];
}

// ---- Public API ----

export interface ForecastParams {
  lat?: number;
  lon?: number;
  hours?: number;
}

export async function getForecast(
  params: ForecastParams = {}
): Promise<ForecastResponse> {
  const { lat = 27.5, lon = 71.9, hours = 24 } = params;

  const url = new URL("/forecast", API_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("hours", String(hours));

  const response = await fetch(url.toString(), {
    next: { revalidate: 600 },  // 10-min cache
  });

  if (!response.ok) {
    throw new Error(
      `Forecast API returned ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// Fire-and-forget warm-up to wake Lambda from cold start.
export function warmUpLambda(): void {
  getForecast().catch(() => {});
}