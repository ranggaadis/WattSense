"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { KWH_RATE_IDR, kwhToRupiah } from "@/lib/energy";
import { sendBudgetWarningEmail } from "@/actions/notifications";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Sum sensor price for both PZEMs; handle missing tables gracefully
    let totalPrice = 0;
    if (db?.sensorData && db?.sensorData2) {
      const dateFilter = {};
      if (budget?.startDate) dateFilter.gte = budget.startDate;
      if (budget?.endDate) {
        const end = new Date(budget.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }

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

      totalPrice = (pzemA._sum.price || 0) + (pzemB._sum.price || 0);
    }

    const response = {
      budget: budget
        ? {
            ...budget,
            amount: budget.amount.toNumber(),
            amountKwh: budget.amount.toNumber() / KWH_RATE_IDR,
            startDate: budget.startDate,
            endDate: budget.endDate,
          }
        : null,
      currentExpenses: totalPrice,
    };

    return response;
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget({ value, unit = "idr", startDate, endDate }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error("Invalid budget value");
    }

    // Validate date range
    const parsedStart = startDate ? new Date(startDate) : null;
    const parsedEndRaw = endDate ? new Date(endDate) : null;
    const parsedEnd = parsedEndRaw
      ? new Date(new Date(parsedEndRaw).setHours(23, 59, 59, 999))
      : null;
    if (parsedStart && Number.isNaN(parsedStart.getTime())) {
      throw new Error("Invalid start date");
    }
    if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
      throw new Error("Invalid end date");
    }
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      throw new Error("Start date must be before end date");
    }

    // Normalize to IDR for storage
    const amount =
      unit === "kwh" ? kwhToRupiah(numericValue) : numericValue;

    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
        startDate: parsedStart,
        endDate: parsedEnd,
      },
      create: {
        userId: user.id,
        amount,
        startDate: parsedStart,
        endDate: parsedEnd,
      },
    });

    // Recompute usage in the new interval and send warning if still >=90%
    let totalPrice = 0;
    if (db?.sensorData && db?.sensorData2) {
      const dateFilter = {};
      if (parsedStart) dateFilter.gte = parsedStart;
      if (parsedEnd) dateFilter.lte = parsedEnd;

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

      totalPrice = (pzemA._sum.price || 0) + (pzemB._sum.price || 0);
    }

    if (totalPrice >= amount * 0.9) {
      await sendBudgetWarningEmail({
        userId: user.id,
        budgetAmountIdr: amount,
        usageIdr: totalPrice,
        percentUsed: (totalPrice / amount) * 100,
      });

      await db.budget.update({
        where: { userId: user.id },
        data: { lastAlertSent: new Date() },
      });
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
