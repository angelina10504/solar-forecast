"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 rounded-md bg-red-100 mx-auto flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h1 className="text-xl font-semibold">Forecast unavailable</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The forecast API didn&apos;t respond. This is likely a Lambda cold start
          timeout or a transient network issue. Try again in a few seconds.
        </p>
        <Button onClick={() => reset()} variant="outline" size="sm">
          Retry
        </Button>
        <details className="text-left mt-6 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Error details</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] p-3 bg-muted rounded">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}