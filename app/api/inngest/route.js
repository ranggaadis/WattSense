import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import functions, {
  checkBudgetAlerts,
  checkBudgetAlertsEvent,
  sendMonthlyEnergySummaries,
  sendMonthlyEnergySummariesEvent,
} from "@/lib/inngest/function.js";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions:
    functions ||
    [
      sendMonthlyEnergySummaries,
      sendMonthlyEnergySummariesEvent,
      checkBudgetAlerts,
      checkBudgetAlertsEvent,
    ],
});
