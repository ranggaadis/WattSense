import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function AmperePage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Ampere" unit="A" dataKey="ampere" sensorA={sensorA} sensorB={sensorB} />;
}
