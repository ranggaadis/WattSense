import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function PowerPage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Power" unit="W" dataKey="power" sensorA={sensorA} sensorB={sensorB} />;
}
