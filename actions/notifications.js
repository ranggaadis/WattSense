"use server";

import { render } from "@react-email/render";
import { Resend } from "resend";
import { db } from "@/lib/prisma";
import EnergySummaryEmail from "@/emails/energy-summary-email";
import BudgetWarningEmail from "@/emails/budget-warning-email";
import { generateEnergyTips } from "@/lib/gemini";
import { KWH_RATE_IDR, rupiahToKwh, formatIDR } from "@/lib/energy";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const sendEmail = async ({ to, subject, react }) => {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping email send.");
    return;
  }
  const html = render(react);
  await resend.emails.send({
    from: "Energy Monitor <no-reply@yourapp.com>",
    to,
    subject,
    html,
  });
};

export async function sendMonthlySummaryEmail(userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  // Compute previous month usage (aggregate price)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

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

  const totalPrice =
    (sensorA._sum.price || 0) + (sensorB._sum.price || 0);
  const totalEnergy =
    (sensorA._sum.energy || 0) + (sensorB._sum.energy || 0);

  let tips = [];
  try {
    tips =
      (await generateEnergyTips(
        "Give exactly 3 concise tips (2 sentences max each) to reduce home or small-office energy usage. Return as bullet points without numbering."
      )) || [];
  } catch (err) {
    console.error("generateEnergyTips failed", err);
  }
  if (!Array.isArray(tips) || tips.length === 0) {
    tips = [
      "Unplug idle chargers and devices; they draw standby power. Use a power strip to switch them off together.",
      "Run major appliances in off-peak hours and only with full loads. Keep filters and coils clean for efficiency.",
      "Use fans and natural light before AC and overhead lights. Close curtains in midday heat to reduce cooling load.",
    ];
  }

  const monthLabel = `${start.toLocaleString("default", { month: "long" })} Summary`;
  await sendEmail({
    to: user.email,
    subject: `${monthLabel} - Energy usage overview`,
    react: (
      <EnergySummaryEmail
        name={user.name || "Customer"}
        monthLabel={monthLabel}
        totalCost={formatIDR(totalPrice)}
        totalEnergy={`${totalEnergy.toFixed(2)} kWh`}
        tips={tips}
      />
    ),
  });
}

export async function sendBudgetWarningEmail({ userId, budgetAmountIdr, usageIdr, percentUsed }) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  const budgetLabel = `${formatIDR(budgetAmountIdr)} (${rupiahToKwh(budgetAmountIdr).toFixed(2)} kWh)`;
  const spentLabel = `${formatIDR(usageIdr)} (${rupiahToKwh(usageIdr).toFixed(2)} kWh)`;

  await sendEmail({
    to: user.email,
    subject: `Budget warning: ${percentUsed.toFixed(1)}% used`,
    react: (
      <BudgetWarningEmail
        name={user.name || "Customer"}
        percentUsed={percentUsed}
        budgetLabel={budgetLabel}
        spentLabel={spentLabel}
      />
    ),
  });
}
