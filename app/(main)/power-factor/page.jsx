import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function PowerFactorPage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Power Factor" unit="pf" dataKey="pf" sensorA={sensorA} sensorB={sensorB} />;
}
