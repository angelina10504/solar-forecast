import { TrendingDown } from "lucide-react";

export function DsmCard() {
  return (
    <div className="space-y-5">
      {/* Headline number */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          Annualized DSM penalty savings
        </div>
        <div className="text-3xl font-bold mt-1 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
          ₹3.43 crore
        </div>
        <div className="text-xs text-muted-foreground">
          vs persistence baseline
        </div>
      </div>

      {/* Comparison row */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div>
          <div className="text-xs text-muted-foreground">Persistence</div>
          <div className="text-base font-semibold text-red-600">
            ₹92.1 lakh
          </div>
          <div className="text-xs text-muted-foreground">92-day exposure</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">LightGBM</div>
          <div className="text-base font-semibold text-emerald-600">
            ₹6.5 lakh
          </div>
          <div className="text-xs text-muted-foreground">93% reduction</div>
        </div>
      </div>

      {/* Methodology */}
      <div className="pt-2 border-t text-xs text-muted-foreground leading-relaxed">
        Penalties computed per India&apos;s CERC{" "}
        <span className="font-medium text-foreground">
          Deviation Settlement Mechanism
        </span>
        : tiered ₹/kWh rates on |actual − forecast| / scheduled. Validated on
        Oct–Dec 2024 holdout (61-day val + 31-day test).
      </div>
    </div>
  );
}