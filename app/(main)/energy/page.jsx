import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function EnergyPage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Energy" unit="kWh" dataKey="energy" sensorA={sensorA} sensorB={sensorB} />;
}
