"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";
import { formatIDR, KWH_RATE_IDR, kwhToRupiah, rupiahToKwh } from "@/lib/energy";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );
  const [budgetUnit, setBudgetUnit] = useState("idr"); // idr | kwh
  const [startDate, setStartDate] = useState(
    initialBudget?.startDate
      ? new Date(initialBudget.startDate).toISOString().slice(0, 10)
      : ""
  );
  const [endDate, setEndDate] = useState(
    initialBudget?.endDate
      ? new Date(initialBudget.endDate).toISOString().slice(0, 10)
      : ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed =
    initialBudget && initialBudget.amount > 0
      ? (currentExpenses / initialBudget.amount) * 100
      : 0;

  const budgetAsIdr = initialBudget?.amount || 0;
  const budgetAsKwh = budgetAsIdr ? rupiahToKwh(budgetAsIdr) : 0;
  const spentAsIdr = currentExpenses || 0;
  const spentAsKwh = spentAsIdr ? rupiahToKwh(spentAsIdr) : 0;
  const rangeLabel =
    startDate && endDate
      ? `${startDate} → ${endDate}`
      : startDate
        ? `${startDate} → now`
        : endDate
          ? `until ${endDate}`
          : "All time";

  const handleUpdateBudget = async () => {
    const parsed = parseFloat(newBudget);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn({
      value: parsed,
      unit: budgetUnit,
      startDate: startDate || null,
      endDate: endDate || null,
    });
  };

  const handleCancel = () => {
    if (!initialBudget) {
      setNewBudget("");
    } else {
      setNewBudget(
        budgetUnit === "kwh"
          ? budgetAsKwh.toFixed(2)
          : budgetAsIdr.toFixed(0)
      );
    }
    setStartDate(
      initialBudget?.startDate
        ? new Date(initialBudget.startDate).toISOString().slice(0, 10)
        : ""
    );
    setEndDate(
      initialBudget?.endDate
        ? new Date(initialBudget.endDate).toISOString().slice(0, 10)
        : ""
    );
    setIsEditing(false);
  };

  const handleUnitChange = (unit) => {
    if (unit === budgetUnit) return;
    const parsed = parseFloat(newBudget);
    if (!isNaN(parsed)) {
      const asIdr = budgetUnit === "kwh" ? kwhToRupiah(parsed) : parsed;
      const converted =
        unit === "kwh"
          ? rupiahToKwh(asIdr).toFixed(2)
          : asIdr.toFixed(0);
      setNewBudget(converted);
    }
    setBudgetUnit(unit);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const progressColor =
    percentUsed >= 90
      ? "bg-red-500"
      : percentUsed >= 75
        ? "bg-yellow-400"
        : "bg-gray-900 dark:bg-white";

  const formattedSpentIdr = formatIDR(spentAsIdr);
  const formattedBudgetIdr = formatIDR(budgetAsIdr);
  const formattedSpentKwh = `${spentAsKwh.toFixed(2)} kWh`;
  const formattedBudgetKwh = `${budgetAsKwh.toFixed(2)} kWh`;

  return (
    <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-semibold">
            Monthly Budget (Default Account)
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-gray-200 dark:border-slate-800 overflow-hidden">
                  <Button
                    type="button"
                    size="sm"
                    variant={budgetUnit === "idr" ? "secondary" : "ghost"}
                    onClick={() => handleUnitChange("idr")}
                    className="rounded-none"
                  >
                    Rp
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={budgetUnit === "kwh" ? "secondary" : "ghost"}
                    onClick={() => handleUnitChange("kwh")}
                    className="rounded-none"
                  >
                    kWh
                  </Button>
                </div>
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-36"
                  placeholder={budgetUnit === "kwh" ? "kWh" : "Rupiah"}
                  autoFocus
                  disabled={isLoading}
                />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                  disabled={isLoading}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                  disabled={isLoading}
                />
                <span className="text-xs text-muted-foreground">
                  1 kWh = Rp {KWH_RATE_IDR.toLocaleString("id-ID")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {initialBudget ? (
                    <span>
                      {formattedSpentIdr} ({formattedSpentKwh}) of{" "}
                      {formattedBudgetIdr} ({formattedBudgetKwh}) used — {rangeLabel}
                    </span>
                  ) : (
                    "No budget set"
                  )}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        {initialBudget && (
          <p className="text-xs text-muted-foreground">{percentUsed.toFixed(1)}% used</p>
        )}
      </CardHeader>
      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={percentUsed}
              className="bg-gray-200 dark:bg-slate-800"
              extraStyles={progressColor}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
