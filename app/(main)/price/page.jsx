import { getSensorReadings } from "@/actions/energy";
import { MetricPage } from "../dashboard/_components/metric-page";

export default async function PricePage() {
  const { sensorA, sensorB } = await getSensorReadings(500);
  return <MetricPage title="Price" unit="Rp" dataKey="price" sensorA={sensorA} sensorB={sensorB} />;
}
