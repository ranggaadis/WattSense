import { NextResponse } from "next/server";
import { getCurrentBudget } from "@/actions/budget";

export async function GET() {
  try {
    const data = await getCurrentBudget();
    const amount = data?.budget?.amount || 0;
    const expenses = data?.currentExpenses || 0;
    const percentUsed = amount > 0 ? (expenses / amount) * 100 : 0;
    return NextResponse.json({
      percentUsed,
      lastAlertSent: data?.budget?.lastAlertSent || null,
    });
  } catch (error) {
    console.error("GET /api/budget/status failed", error);
    return NextResponse.json(
      { error: "Failed to fetch budget status" },
      { status: 500 }
    );
  }
}
