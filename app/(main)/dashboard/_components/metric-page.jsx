"use client";

import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { format, sub } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "3d", label: "Last 3 Days" },
  { value: "7d", label: "Last 7 Days" },
  { value: "1m", label: "Last Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

const getCutoff = (range) => {
  const now = new Date();
  switch (range) {
    case "3d":
      return sub(now, { days: 3 });
    case "7d":
      return sub(now, { days: 7 });
    case "1m":
      return sub(now, { months: 1 });
    case "3m":
      return sub(now, { months: 3 });
    case "1y":
      return sub(now, { years: 1 });
    case "24h":
    default:
      return sub(now, { hours: 24 });
  }
};

const RangeSelect = ({ value, onChange, cutoff }) => {
  const rangeText = `${format(cutoff, "MMM d")} - ${format(new Date(), "MMM d")}`;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <SelectValue placeholder="Select range" />
            <span className="text-xs text-muted-foreground">{rangeText}</span>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const mergeSensors = (sensorA, sensorB, key) => {
  const map = new Map();
  const normalize = (row, prefix) => {
    const ts = row?.date ? new Date(row.date) : new Date(row?.timestamp || 0);
    if (Number.isNaN(ts.getTime())) return null;
    const iso = ts.toISOString();
    return { ts, iso, value: row?.[key] ?? 0, prefix };
  };

  sensorA.forEach((row) => {
    const normalized = normalize(row, "A");
    if (!normalized) return;
    map.set(normalized.iso, {
      timestamp: normalized.iso,
      date: normalized.ts,
      valueA: normalized.value,
      valueB: 0,
    });
  });

  sensorB.forEach((row) => {
    const normalized = normalize(row, "B");
    if (!normalized) return;
    const existing = map.get(normalized.iso) || {
      timestamp: normalized.iso,
      date: normalized.ts,
      valueA: 0,
      valueB: 0,
    };
    map.set(normalized.iso, { ...existing, valueB: normalized.value });
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

const xAxisForRange = (range) => {
  switch (range) {
    case "24h":
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60,
        dateTimeLabelFormats: { hour: "%b %e %H:%M", day: "%b %e" },
      };
    case "3d":
    case "7d":
    case "1m":
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60 * 24,
        dateTimeLabelFormats: { day: "%b %e", month: "%b %e" },
      };
    case "3m":
    case "1y":
    default:
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60 * 24 * 30,
        dateTimeLabelFormats: { month: "%b '%y", year: "%Y" },
      };
  }
};

export const MetricPage = ({ title, unit, dataKey, sensorA = [], sensorB = [] }) => {
  const [range, setRange] = useState("24h");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const merged = useMemo(() => mergeSensors(sensorA, sensorB, dataKey), [sensorA, sensorB, dataKey]);

  const cutoff = useMemo(() => getCutoff(range), [range]);
  const filtered = useMemo(() => {
    const now = new Date();
    return merged.filter((row) => {
      const ts = row.date ? new Date(row.date) : new Date(row.timestamp);
      if (Number.isNaN(ts.getTime())) return false;
      return ts >= cutoff && ts <= now;
    });
  }, [merged, cutoff]);

  const data = filtered.length ? filtered : merged;
  const series = [
    {
      name: "PZEM A",
      data: data.map((row) => [new Date(row.timestamp).getTime(), row.valueA || 0]),
    },
    {
      name: "PZEM B",
      data: data.map((row) => [new Date(row.timestamp).getTime(), row.valueB || 0]),
    },
  ];

  const options = {
    chart: { type: "line", height: 320 },
    title: { text: "" },
    xAxis: xAxisForRange(range),
    yAxis: { title: { text: unit } },
    legend: { enabled: true },
    series,
    credits: { enabled: false },
  };

  const tableRows = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, range, dataKey, sensorA, sensorB]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") {
        setPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === "ArrowLeft") {
        setPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages]);

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{title} Overview</CardTitle>
            <CardDescription>PZEM A &amp; B readings</CardDescription>
          </div>
          <RangeSelect value={range} onChange={setRange} cutoff={cutoff} />
        </CardHeader>
        <CardContent>
          {series[0].data.length === 0 && series[1].data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No data for selected range
            </div>
          ) : (
            <HighchartsReact highcharts={Highcharts} options={options} />
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">{title} Readings</CardTitle>
          <CardDescription>Timestamp and values per sensor</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 200].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} of {totalPages} pages
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">PZEM A ({unit})</TableHead>
                <TableHead className="text-right">PZEM B ({unit})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.map((row) => (
                <TableRow key={row.timestamp}>
                  <TableCell>{format(new Date(row.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                  <TableCell className="text-right">{(row.valueA || 0).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{(row.valueB || 0).toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagedRows.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">No readings available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
