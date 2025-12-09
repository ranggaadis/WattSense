import React from "react";
import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EnergySummaryEmail from "@/emails/energy-summary-email";
import BudgetWarningEmail from "@/emails/budget-warning-email";
import { generateEnergyTips } from "@/lib/gemini";
import { formatIDR, rupiahToKwh } from "@/lib/energy";

// Helpers
const getPreviousMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1); // exclusive
  return { start, end };
};

const inclusiveEnd = (date) => {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const ensureTips = async () => {
  let tips =
    (await generateEnergyTips(
      "Give exactly 3 concise tips (2 sentences max each) to reduce home or small-office energy usage. Return as bullet points without numbering."
    )) || [];

  if (!Array.isArray(tips) || tips.length === 0) {
    tips = [
      "Unplug idle chargers and devices; they draw standby power. Use a power strip to switch them off together.",
      "Run appliances off-peak and only with full loads. Keep filters and coils clean for better efficiency.",
      "Use fans and natural light before AC and overhead lights. Close curtains in midday heat to cut cooling load.",
    ];
  }

  return tips.slice(0, 3);
};

// Shared handler for monthly energy summaries
const monthlyEnergyHandler = async ({ step }) => {
  const users = await step.run("fetch-users", () => db.user.findMany());
  const { start, end } = getPreviousMonthRange();
  const monthLabel = start.toLocaleString("default", { month: "long" });
  const tips = await ensureTips();

  for (const user of users) {
    if (!user.email) continue;

    await step.run(`summary-${user.id}`, async () => {
      const [sensorA, sensorB] = await Promise.all([
        db.sensorData.aggregate({
          _sum: { price: true, energy: true },
          where: { date: { gte: start, lt: end } },
        }),
        db.sensorData2.aggregate({
          _sum: { price: true, energy: true },
          where: { date: { gte: start, lt: end } },
        }),
      ]);

      const totalPrice = (sensorA._sum.price || 0) + (sensorB._sum.price || 0);
      const totalEnergy = (sensorA._sum.energy || 0) + (sensorB._sum.energy || 0);

      const result = await sendEmail({
        to: user.email,
        subject: `${monthLabel} Summary - Energy usage overview`,
        react: (
          <EnergySummaryEmail
            name={user.name || "Customer"}
            monthLabel={`${monthLabel} Summary`}
            totalCost={formatIDR(totalPrice)}
            totalEnergy={`${totalEnergy.toFixed(2)} kWh`}
            tips={tips}
          />
        ),
      });

      if (result?.success === false) {
        throw new Error(result?.error || "Failed to send summary email");
      }
    });
  }
  return { processed: users.length };
};

// Monthly energy summary (cron)
export const sendMonthlyEnergySummaries = inngest.createFunction(
  { id: "monthly-energy-summaries", name: "Monthly Energy Summaries" },
  { cron: "0 0 1 * *" },
  monthlyEnergyHandler
);

// Monthly energy summary (manual event trigger)
export const sendMonthlyEnergySummariesEvent = inngest.createFunction(
  { id: "monthly-energy-summaries-event", name: "Monthly Energy Summaries (manual)" },
  { event: "app/energy.monthly" },
  monthlyEnergyHandler
);

// Shared handler for budget alerts
const budgetAlertsHandler = async ({ step }) => {
  const budgets = await step.run("fetch-budgets", () =>
    db.budget.findMany({
      include: { user: true },
    })
  );

  for (const budget of budgets) {
    if (!budget?.user?.email) continue;

    await step.run(`budget-${budget.id}`, async () => {
      const dateFilter = {};
      if (budget.startDate) dateFilter.gte = budget.startDate;
      if (budget.endDate) dateFilter.lte = inclusiveEnd(budget.endDate);

      const [pzemA, pzemB] = await Promise.all([
        db.sensorData.aggregate({
          _sum: { price: true },
          where: Object.keys(dateFilter).length ? { date: dateFilter } : undefined,
        }),
        db.sensorData2.aggregate({
          _sum: { price: true },
          where: Object.keys(dateFilter).length ? { date: dateFilter } : undefined,
        }),
      ]);

      const totalPrice = (pzemA._sum.price || 0) + (pzemB._sum.price || 0);
      const budgetAmount = budget.amount?.toNumber ? budget.amount.toNumber() : Number(budget.amount || 0);
      if (!budgetAmount) return;

      const percentUsed = (totalPrice / budgetAmount) * 100;
      if (percentUsed < 90) return;

      // Optional throttle: avoid resending more than once per day
      if (budget.lastAlertSent) {
        const last = new Date(budget.lastAlertSent).getTime();
        if (Date.now() - last < 24 * 60 * 60 * 1000) return;
      }

      const result = await sendEmail({
        to: budget.user.email,
        subject: `Budget warning: ${percentUsed.toFixed(1)}% used`,
        react: (
          <BudgetWarningEmail
            name={budget.user.name || "Customer"}
            percentUsed={percentUsed}
            budgetLabel={`${formatIDR(budgetAmount)} (${rupiahToKwh(budgetAmount).toFixed(2)} kWh)`}
            spentLabel={`${formatIDR(totalPrice)} (${rupiahToKwh(totalPrice).toFixed(2)} kWh)`}
          />
        ),
      });

      if (result?.success === false) {
        throw new Error(result?.error || "Failed to send budget alert");
      }

      await db.budget.update({
        where: { id: budget.id },
        data: { lastAlertSent: new Date() },
      });
    });
  }

  return { processed: budgets.length };
};

// Budget alerts (cron)
export const checkBudgetAlerts = inngest.createFunction(
  { id: "budget-alerts", name: "Budget Alerts" },
  { cron: "0 */6 * * *" },
  budgetAlertsHandler
);

// Budget alerts (manual event trigger)
export const checkBudgetAlertsEvent = inngest.createFunction(
  { id: "budget-alerts-event", name: "Budget Alerts (manual)" },
  { event: "app/budget.alerts" },
  budgetAlertsHandler
);

// Export list for Inngest registration
export default [
  sendMonthlyEnergySummaries,
  sendMonthlyEnergySummariesEvent,
  checkBudgetAlerts,
  checkBudgetAlertsEvent,
];
