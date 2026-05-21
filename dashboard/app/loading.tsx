export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl animate-pulse">
          ☀
        </div>
        <div className="text-sm text-muted-foreground">
          Fetching forecast from AWS Lambda...
        </div>
        <div className="text-xs text-muted-foreground/70 max-w-xs text-center">
          May take up to 25 seconds on a cold start
        </div>
      </div>
    </div>
  );
}