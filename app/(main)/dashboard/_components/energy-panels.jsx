"use client";

import { useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { format, sub } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatIDR } from "@/lib/energy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

const colors = {
  a: "#7C3AED",
  b: "#38BDF8",
  grid: "#e5e7eb",
};

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

const NoData = () => (
  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
    No data for selected range
  </div>
);

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

const filterByRange = (data, range) => {
  const cutoff = getCutoff(range);
  return data.filter((r) => {
    const rawTs = r.date || r.timestamp;
    if (!rawTs) return false;
    const ts = new Date(rawTs);
    if (Number.isNaN(ts.getTime())) return false;
    return ts >= cutoff;
  });
};

const buildSeries = (data, keys) =>
  keys.map(({ key, name, color }) => ({
    name,
    color,
    data: data.reduce((arr, r) => {
      const rawTs = r.date || r.timestamp;
      const ts = new Date(rawTs);
      if (Number.isNaN(ts.getTime())) return arr;
      arr.push([ts.getTime(), r[key] ?? 0]);
      return arr;
    }, []),
  }));

const xAxisForRange = (range) => {
  switch (range) {
    case "24h":
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60, // 1 hour
        dateTimeLabelFormats: { hour: "%b %e %H:%M", day: "%b %e" },
      };
    case "3d":
    case "7d":
    case "1m":
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60 * 24, // 1 day
        dateTimeLabelFormats: { day: "%b %e", month: "%b %e" },
      };
    case "3m":
    case "1y":
    default:
      return {
        type: "datetime",
        tickInterval: 1000 * 60 * 60 * 24 * 30, // approx 1 month
        dateTimeLabelFormats: { month: "%b '%y", year: "%Y" },
      };
  }
};

const lineOptions = (title, series, yTitle, range) => ({
  chart: { type: "line", height: 300 },
  title: { text: "" },
  xAxis: xAxisForRange(range),
  yAxis: { title: { text: yTitle } },
  legend: { enabled: true },
  series,
  credits: { enabled: false },
});

const columnOptions = (title, series, yTitle, range) => ({
  chart: { type: "column", height: 300 },
  title: { text: "" },
  xAxis: xAxisForRange(range),
  yAxis: { title: { text: yTitle } },
  legend: { enabled: true },
  plotOptions: {
    column: { pointPadding: 0.1, borderWidth: 0 },
  },
  series,
  credits: { enabled: false },
});

const areaOptions = (title, series, yTitle, domain, range) => ({
  chart: { type: "areaspline", height: 300 },
  title: { text: "" },
  xAxis: xAxisForRange(range),
  yAxis: { title: { text: yTitle }, min: domain?.[0], max: domain?.[1] },
  legend: { enabled: true },
  plotOptions: {
    areaspline: { fillOpacity: 0.2 },
  },
  series,
  credits: { enabled: false },
});

export const EnergyPanels = ({ sensorA = [], sensorB = [] } = {}) => {
  const [powerRange, setPowerRange] = useState("24h");
  const [pfRange, setPfRange] = useState("24h");
  const [energyRange, setEnergyRange] = useState("24h");
  const [priceRange, setPriceRange] = useState("24h");
  const [voltageRange, setVoltageRange] = useState("24h");
  const [currentRange, setCurrentRange] = useState("24h");
  const [totalsStart, setTotalsStart] = useState("");
  const [totalsEnd, setTotalsEnd] = useState("");

  const mergedReadings = useMemo(() => {
    const map = new Map();
    const toDate = (row) => {
      if (row?.date) return new Date(row.date);
      if (row?.timestamp) return new Date(row.timestamp);
      return new Date();
    };

    sensorA.forEach((row) => {
      const date = toDate(row);
      const ts = date.toISOString();
      const key = ts;
      map.set(key, {
        timestamp: ts,
        date,
        voltageA: row.voltage,
        ampereA: row.ampere,
        powerA: row.power,
        energyA: row.energy,
        pfA: row.pf,
        priceA: row.price,
      });
    });

    sensorB.forEach((row) => {
      const date = toDate(row);
      const ts = date.toISOString();
      const key = ts;
      const existing = map.get(key) || { timestamp: ts, date };
      map.set(key, {
        ...existing,
        date,
        voltageB: row.voltage,
        ampereB: row.ampere,
        powerB: row.power,
        energyB: row.energy,
        pfB: row.pf,
        priceB: row.price,
      });
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return merged.map((entry) => ({
      voltageA: 0,
      voltageB: 0,
      ampereA: 0,
      ampereB: 0,
      powerA: 0,
      powerB: 0,
      energyA: 0,
      energyB: 0,
      pfA: 0,
      pfB: 0,
      priceA: 0,
      priceB: 0,
      ...entry,
    }));
  }, [sensorA, sensorB]);

  const readings = mergedReadings;

  const powerData = filterByRange(readings, powerRange);
  const pfData = filterByRange(readings, pfRange);
  const energyData = filterByRange(readings, energyRange);
  const priceData = filterByRange(readings, priceRange);
  const voltageData = filterByRange(readings, voltageRange);
  const currentData = filterByRange(readings, currentRange);

  const latestA = sensorA[sensorA.length - 1] || {};
  const latestB = sensorB[sensorB.length - 1] || {};
  const latestPowerA = latestA.power || 0;
  const latestPowerB = latestB.power || 0;
  const latestVoltA = latestA.voltage || 0;
  const latestVoltB = latestB.voltage || 0;
  const latestAmpA = latestA.ampere || 0;
  const latestAmpB = latestB.ampere || 0;

  const energyTotals = energyData.length ? energyData : readings;
  const priceTotals = priceData.length ? priceData : readings;
  const totalEnergyA = energyTotals.reduce((acc, r) => acc + (r.energyA || 0), 0);
  const totalEnergyB = energyTotals.reduce((acc, r) => acc + (r.energyB || 0), 0);
  const totalPriceA = priceTotals.reduce((acc, r) => acc + (r.priceA || 0), 0);
  const totalPriceB = priceTotals.reduce((acc, r) => acc + (r.priceB || 0), 0);

  const filteredTotals = useMemo(() => {
    if (!totalsStart && !totalsEnd) return readings;
    const startDate = totalsStart ? new Date(totalsStart) : null;
    const endDate = totalsEnd ? new Date(totalsEnd) : null;
    return readings.filter((r) => {
      const rawTs = r.date || r.timestamp;
      if (!rawTs) return false;
      const ts = new Date(rawTs);
      if (Number.isNaN(ts.getTime())) return false;
      if (startDate && ts < startDate) return false;
      if (endDate) {
        // include endDate full day
        const endInclusive = new Date(endDate);
        endInclusive.setHours(23, 59, 59, 999);
        if (ts > endInclusive) return false;
      }
      return true;
    });
  }, [readings, totalsStart, totalsEnd]);

  const totalsSource = filteredTotals;
  const windowEnergyA = totalsSource.reduce((acc, r) => acc + (r.energyA || 0), 0);
  const windowEnergyB = totalsSource.reduce((acc, r) => acc + (r.energyB || 0), 0);
  const windowPriceA = totalsSource.reduce((acc, r) => acc + (r.priceA || 0), 0);
  const windowPriceB = totalsSource.reduce((acc, r) => acc + (r.priceB || 0), 0);

  const last24h = useMemo(() => {
    const cutoff = sub(new Date(), { hours: 24 });
    const now = new Date();
    return readings.filter((r) => {
      const rawTs = r.date || r.timestamp;
      if (!rawTs) return false;
      const ts = new Date(rawTs);
      if (Number.isNaN(ts.getTime())) return false;
      return ts >= cutoff && ts <= now;
    });
  }, [readings]);
  const last24hPriceA = last24h.reduce((acc, r) => acc + (r.priceA || 0), 0);
  const last24hPriceB = last24h.reduce((acc, r) => acc + (r.priceB || 0), 0);
  const last24hEnergyA = last24h.reduce((acc, r) => acc + (r.energyA || 0), 0);
  const last24hEnergyB = last24h.reduce((acc, r) => acc + (r.energyB || 0), 0);

  const stats = [
    {
      title: "Realtime Power",
      value: `${(latestPowerA + latestPowerB).toFixed(0)} W`,
      sub: `PZEM A ${latestPowerA.toFixed(0)} W | PZEM B ${latestPowerB.toFixed(0)} W`,
    },
    {
      title: "Voltage",
      value: `${latestVoltA.toFixed(0)} / ${latestVoltB.toFixed(0)} V`,
      sub: "PZEM A / PZEM B",
    },
    {
      title: "Current",
      value: `${latestAmpA.toFixed(2)} / ${latestAmpB.toFixed(2)} A`,
      sub: "PZEM A / PZEM B",
    },
    {
      title: "Last 24h Cost (est.)",
      value: formatIDR(last24hPriceA + last24hPriceB),
      sub: `${(last24hEnergyA + last24hEnergyB).toFixed(2)} kWh`,
    },
  ];

  const powerSeries = buildSeries(powerData, [
    { key: "powerA", name: "PZEM A", color: colors.a },
    { key: "powerB", name: "PZEM B", color: colors.b },
  ]);

  const pfSeries = buildSeries(pfData, [
    { key: "pfA", name: "PF PZEM A", color: colors.a },
    { key: "pfB", name: "PF PZEM B", color: colors.b },
  ]);

  const energySeries = buildSeries(energyData, [
    { key: "energyA", name: "PZEM A", color: colors.a },
    { key: "energyB", name: "PZEM B", color: colors.b },
  ]);

  const priceSeries = buildSeries(priceData, [
    { key: "priceA", name: "PZEM A", color: colors.a },
    { key: "priceB", name: "PZEM B", color: colors.b },
  ]);

  const voltageSeries = buildSeries(voltageData, [
    { key: "voltageA", name: "PZEM A", color: colors.a },
    { key: "voltageB", name: "PZEM B", color: colors.b },
  ]);

  const currentSeries = buildSeries(currentData, [
    { key: "ampereA", name: "PZEM A", color: colors.a },
    { key: "ampereB", name: "PZEM B", color: colors.b },
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Realtime Trend (Power)</CardTitle>
              <CardDescription>Power usage for PZEM A &amp; B. X-axis is timestamp; Y-axis is Watts.</CardDescription>
            </div>
            <RangeSelect value={powerRange} onChange={setPowerRange} cutoff={getCutoff(powerRange)} />
          </CardHeader>
          <CardContent className="h-[320px]">
            {powerSeries[0].data.length === 0 && powerSeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={lineOptions("", powerSeries, "W", powerRange)} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Power Factor</CardTitle>
              <CardDescription>X-axis is timestamp.</CardDescription>
            </div>
            <RangeSelect value={pfRange} onChange={setPfRange} cutoff={getCutoff(pfRange)} />
          </CardHeader>
          <CardContent className="h-[320px]">
            {pfSeries[0].data.length === 0 && pfSeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={areaOptions("", pfSeries, "PF", [0, 1], pfRange)} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Energy (kWh)</CardTitle>
              <CardDescription>X-axis is date; Y-axis is energy.</CardDescription>
            </div>
            <RangeSelect value={energyRange} onChange={setEnergyRange} cutoff={getCutoff(energyRange)} />
          </CardHeader>
          <CardContent className="h-[300px]">
            {energySeries[0].data.length === 0 && energySeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={columnOptions("", energySeries, "kWh", energyRange)} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Estimated Cost (IDR)</CardTitle>
              <CardDescription>X-axis is date; Y-axis is rupiah.</CardDescription>
            </div>
            <RangeSelect value={priceRange} onChange={setPriceRange} cutoff={getCutoff(priceRange)} />
          </CardHeader>
          <CardContent className="h-[300px]">
            {priceSeries[0].data.length === 0 && priceSeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={columnOptions("", priceSeries, "Rp", priceRange)} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardDescription>Total Energy (selected range)</CardDescription>
                <CardTitle className="text-xl">
                  {(windowEnergyA + windowEnergyB).toFixed(2)} kWh
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  PZEM A {windowEnergyA.toFixed(2)} kWh | PZEM B {windowEnergyB.toFixed(2)} kWh
                </p>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <label className="font-medium text-[11px] uppercase tracking-wide">Interval</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={totalsStart}
                    onChange={(e) => setTotalsStart(e.target.value)}
                    className="h-8 rounded border border-gray-200 dark:border-slate-800 bg-transparent px-2 text-xs"
                  />
                  <input
                    type="date"
                    value={totalsEnd}
                    onChange={(e) => setTotalsEnd(e.target.value)}
                    className="h-8 rounded border border-gray-200 dark:border-slate-800 bg-transparent px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardDescription>Estimated Spend (selected range)</CardDescription>
                <CardTitle className="text-xl">
                  {formatIDR(windowPriceA + windowPriceB)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  PZEM A {formatIDR(windowPriceA)} | PZEM B {formatIDR(windowPriceB)}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <label className="font-medium text-[11px] uppercase tracking-wide">Interval</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={totalsStart}
                    onChange={(e) => setTotalsStart(e.target.value)}
                    className="h-8 rounded border border-gray-200 dark:border-slate-800 bg-transparent px-2 text-xs"
                  />
                  <input
                    type="date"
                    value={totalsEnd}
                    onChange={(e) => setTotalsEnd(e.target.value)}
                    className="h-8 rounded border border-gray-200 dark:border-slate-800 bg-transparent px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Voltage</CardTitle>
              <CardDescription>Timestamp vs Voltage (V)</CardDescription>
            </div>
            <RangeSelect value={voltageRange} onChange={setVoltageRange} cutoff={getCutoff(voltageRange)} />
          </CardHeader>
          <CardContent className="h-[320px]">
            {voltageSeries[0].data.length === 0 && voltageSeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={lineOptions("", voltageSeries, "V", voltageRange)} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-2">
            <div>
              <CardTitle className="text-base font-semibold">Current (Ampere)</CardTitle>
              <CardDescription>Timestamp vs Current (A)</CardDescription>
            </div>
            <RangeSelect value={currentRange} onChange={setCurrentRange} cutoff={getCutoff(currentRange)} />
          </CardHeader>
          <CardContent className="h-[320px]">
            {currentSeries[0].data.length === 0 && currentSeries[1].data.length === 0 ? (
              <NoData />
            ) : (
              <HighchartsReact highcharts={Highcharts} options={lineOptions("", currentSeries, "A", currentRange)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


