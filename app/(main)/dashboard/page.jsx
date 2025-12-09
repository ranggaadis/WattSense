import { getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { BudgetProgress } from "./_components/budget-progress";
import { EnergyPanels } from "./_components/energy-panels";
import { getSensorReadings } from "@/actions/energy";
import { RefreshStatus } from "./_components/refresh-status";

export default async function DashboardPage() {
  const [accounts, sensorReadings] = await Promise.all([
    getUserAccounts(),
    getSensorReadings(200),
  ]);

  // Budget is user-scoped, so fetch regardless of account selection
  const budgetData = await getCurrentBudget();

  return (
    <div className="space-y-8">
      {/* Purple top band to echo reference design */}
      <div className="gradient-purple-band h-6 rounded-xl" />

      <div className="flex justify-end">
        <RefreshStatus />
      </div>

      <EnergyPanels sensorA={sensorReadings.sensorA} sensorB={sensorReadings.sensorB} />

      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />
    </div>
  );
}
