"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const formatSince = (from) => {
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - from) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  if (mins === 0) return `${secs} second${secs === 1 ? "" : "s"} ago`;
  return `${mins} minute${mins === 1 ? "" : "s"} ${secs} second${secs === 1 ? "" : "s"} ago`;
};

export const RefreshStatus = () => {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [since, setSince] = useState("just now");

  const doRefresh = useCallback(() => {
    router.refresh();
    const now = Date.now();
    setLastUpdated(now);
    setSince("just now");
  }, [router]);

  useEffect(() => {
    // live countdown text
    const interval = setInterval(() => {
      setSince(formatSince(lastUpdated));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    // auto refresh every 15s
    const interval = setInterval(() => {
      doRefresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [doRefresh]);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={doRefresh}
        className="h-8 w-8"
        aria-label="Refresh data"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <span>Updated {since}</span>
    </div>
  );
};
