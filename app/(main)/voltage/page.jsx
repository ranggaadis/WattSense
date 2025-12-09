import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function VoltagePage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Voltage" unit="V" dataKey="voltage" sensorA={sensorA} sensorB={sensorB} />;
}
