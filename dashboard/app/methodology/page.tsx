import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MethodologyPage() {
  return (
        <div className="min-h-screen bg-background">
          <header className="border-b">
              <div className="max-w-3xl mx-auto px-6 py-4">
                  <Link
                      href="/"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                      <ArrowLeft className="w-4 h-4" />
                      Back to dashboard
                  </Link>
              </div>
          </header>

          <main className="max-w-3xl mx-auto px-6 py-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Methodology</h1>
              <p className="text-muted-foreground text-base mb-10">
                  How this forecast is built, and how to read it.
              </p>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">The plant</h2>
                  <p className="leading-relaxed text-sm">
                      Bhadla Solar Park in Rajasthan is one of the largest operational
                      solar installations in the world — 2,245 MW of nameplate AC
                      capacity across roughly 14,000 acres of the Thar Desert. The site
                      receives more than 300 sunny days per year.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Data sources</h2>
                  <p className="leading-relaxed text-sm mb-3">
                      Two years of hourly weather data (Jan 2023 – Dec 2024) from
                      Open-Meteo&apos;s Historical Archive, sourced from ECMWF&apos;s
                      ERA5 reanalysis. Variables include shortwave radiation, direct
                      beam radiation, diffuse radiation, ambient temperature, cloud
                      cover, wind speed, relative humidity, surface pressure.
                  </p>
                  <p className="leading-relaxed text-sm">
                      Real plant-level SCADA data from Adani Green is not public, so
                      ground-truth MW generation is synthesized using pvlib (NREL&apos;s
                      industry-standard Python library) configured to the plant&apos;s
                      actual specifications: 25° south-facing tilt, 1.2 DC/AC ratio,
                      ~14% system losses (PVWatts default), SAPM cell-temperature model.
                      Stochastic noise (3% multiplicative, 15 MW additive) is layered on
                      top to prevent the model from learning a perfectly clean physics
                      relationship.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Storage and querying</h2>
                  <p className="leading-relaxed text-sm">
                      Raw weather and synthetic generation are stored in AWS S3 as
                      Hive-partitioned Parquet (year=YYYY/month=MM/), with schemas
                      auto-discovered by AWS Glue. Queries run on AWS Athena and benefit
                      from partition pruning — a typical month-filtered query scans 4 KB
                      instead of 130 KB (32× reduction).
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Modeling</h2>
                  <p className="leading-relaxed text-sm mb-3">
                      LightGBM gradient-boosted trees trained on 30 features: raw
                      weather (8), calendar (4), cyclical encodings (4), lagged
                      generation at 1/24/48/168 hours (4), lagged weather at 24/168
                      hours (6), rolling means (2), and solar geometry from pvlib (2 —
                      zenith and elevation angle).
                  </p>
                  <p className="leading-relaxed text-sm mb-3">
                      Trained chronologically — Jan 2023 to Sep 2024 for training,
                      Oct–Nov 2024 for validation, Dec 2024 for held-out test.
                      Early-stopping on val RMSE. No data leakage: rolling features use
                      shift(1).rolling(N) so the current row&apos;s value is never
                      included in its own rolling stat.
                  </p>
                  <p className="leading-relaxed text-sm">
                      Uncertainty quantification via three additional LightGBM models
                      trained with quantile loss at α = 0.10, 0.50, 0.90 — providing
                      P10, P50, P90 alongside the point forecast. Isotonic
                      post-processing (row-wise sort) prevents quantile crossing.
                      Empirical coverage of the P10-P90 band on val data: 86% (vs 80%
                      nominal — slightly conservative, the preferred direction for grid
                      operators).
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Accuracy</h2>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                          <thead>
                              <tr className="border-b">
                                  <th className="text-left py-2 font-medium">Metric</th>
                                  <th className="text-right py-2 font-medium">Persistence</th>
                                  <th className="text-right py-2 font-medium">LightGBM</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr className="border-b">
                                  <td className="py-2">Test MAE</td>
                                  <td className="text-right font-mono">13.77 MW</td>
                                  <td className="text-right font-mono">9.53 MW</td>
                              </tr>
                              <tr className="border-b">
                                  <td className="py-2">Test nMAE</td>
                                  <td className="text-right font-mono">0.61%</td>
                                  <td className="text-right font-mono">0.42%</td>
                              </tr>
                              <tr className="border-b">
                                  <td className="py-2">Val MAE</td>
                                  <td className="text-right font-mono">23.27 MW</td>
                                  <td className="text-right font-mono">11.40 MW</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                      Industry literature reports day-ahead utility-scale solar
                      forecasting at 4–8% nMAE. The 0.42% reported here reflects the
                      synthetic-target setup; real-world performance against actual
                      SCADA would be lower.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">DSM penalty economics</h2>
                  <p className="leading-relaxed text-sm mb-3">
                      India&apos;s Central Electricity Regulatory Commission (CERC)
                      Deviation Settlement Mechanism (DSM) penalizes generators for
                      deviating from their scheduled output. Tiered rates apply to the
                      deviation percentage: 0–15% free, 15–25% at ₹0.50/kWh, 25–35% at
                      ₹1.00/kWh, 35%+ at ₹1.50/kWh.
                  </p>
                  <div className="overflow-x-auto mb-3">
                      <table className="w-full text-sm border-collapse">
                          <thead>
                              <tr className="border-b">
                                  <th className="text-left py-2 font-medium">Period</th>
                                  <th className="text-right py-2 font-medium">Persistence</th>
                                  <th className="text-right py-2 font-medium">LightGBM</th>
                                  <th className="text-right py-2 font-medium">Reduction</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr className="border-b">
                                  <td className="py-2">Val (Oct-Nov)</td>
                                  <td className="text-right font-mono">₹89.1 lakh</td>
                                  <td className="text-right font-mono">₹5.4 lakh</td>
                                  <td className="text-right font-mono text-emerald-600">94%</td>
                              </tr>
                              <tr className="border-b">
                                  <td className="py-2">Test (Dec)</td>
                                  <td className="text-right font-mono">₹3.06 lakh</td>
                                  <td className="text-right font-mono">₹1.05 lakh</td>
                                  <td className="text-right font-mono text-emerald-600">66%</td>
                              </tr>
                              <tr className="border-b font-semibold">
                                  <td className="py-2">Combined 92d</td>
                                  <td className="text-right font-mono">₹92.1 lakh</td>
                                  <td className="text-right font-mono">₹6.5 lakh</td>
                                  <td className="text-right font-mono text-emerald-600">93%</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <p className="leading-relaxed text-xs text-muted-foreground">
                      Annualized extrapolation (×4) ≈ ₹3.43 crore in avoided penalty
                      exposure for a plant of this size. Most of the gap concentrates in
                      high-variability periods — persistence collapses during weather
                      transitions while LightGBM responds to the changing inputs.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Serving</h2>
                  <p className="leading-relaxed text-sm">
                      Inference runs on AWS Lambda from a containerized Python 3.11
                      image. The Lambda pulls the model from S3 on cold start
                      (~17s init, cached afterwards), fetches the next 24 hours of
                      forecasted weather from Open-Meteo&apos;s free API, computes 30
                      features per hour, and returns point + P10/P50/P90 predictions as
                      JSON. API Gateway (HTTP API) provides the public HTTPS endpoint.
                      Memory configured at 3 GB to handle pvlib + LightGBM peak memory
                      ~261 MB with headroom. CloudWatch logs all invocations.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">What-if simulator</h2>
                  <p className="leading-relaxed text-sm">
                      The cloud cover and temperature sliders on the dashboard apply a
                      first-order sensitivity model on the frontend rather than
                      re-invoking the Lambda. The adjustment factor is (1 - 0.75 ×
                      cloud_offset) × (1 - 0.004 × temp_offset), using typical clear-sky
                      transmission and the PVWatts panel temperature coefficient. This
                      is faithful enough for intuition building. A production version
                      would re-run inference server-side with adjusted weather inputs.
                  </p>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Known limitations</h2>
                  <ul className="space-y-2 leading-relaxed text-sm list-disc pl-5">
                      <li>
                          <strong>Synthetic target.</strong> Generation is modeled from
                          weather + pvlib + noise, not measured. Real plant performance
                          would have inverter clipping, soiling losses, partial shading,
                          and other irreducible noise sources not captured here.
                      </li>
                      <li>
                          <strong>Lag features zeroed at inference.</strong> The model was
                          trained with lagged generation history, but real-time SCADA
                          isn&apos;t available, so these features are zeroed when serving.
                          The model degrades gracefully because shortwave radiation
                          dominates feature importance (~40× any other feature).
                      </li>
                      <li>
                          <strong>No monsoon coverage in test set.</strong> Test data is
                          December — clear, predictable. Real Bhadla operates through
                          June–September monsoons where cloud cover is highly variable.
                      </li>
                      <li>
                          <strong>Open weather data only.</strong> Operating teams use
                          proprietary numerical weather prediction with much higher
                          resolution. The forecast here is limited by Open-Meteo&apos;s
                          free ERA5-derived data.
                      </li>
                  </ul>
              </section>

              <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-3">Source</h2>
                  <p className="leading-relaxed text-sm">
                      Full code, notebooks, deployment Dockerfile, and API documentation at github.com/angelina10504/solar-forecast
                  </p>
              </section>
          </main>
          <footer className="border-t mt-12">
              <div className="max-w-3xl mx-auto px-6 py-4 text-xs text-muted-foreground">
                  Built by Angelina Gupta · 2026
              </div>
          </footer>
      </div>
  );
}