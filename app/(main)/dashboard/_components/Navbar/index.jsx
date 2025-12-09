"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutDashboard,
  AlignJustify as StackedBar,
  Bell,
} from "lucide-react";
import { useSidebar } from "../Sidebar/context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

const Navbar = ({ offsetHeader = false }) => {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const stickyOffset = offsetHeader ? "top-20" : "top-0";
  const [percentUsed, setPercentUsed] = useState(0);
  const [lastAlertSent, setLastAlertSent] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/budget/status");
        if (!res.ok) return;
        const data = await res.json();
        setPercentUsed(data.percentUsed || 0);
        setLastAlertSent(data.lastAlertSent || null);
      } catch (err) {
        console.error("Failed to load budget status", err);
      }
    };
    fetchStatus();

    // poll every 60s to catch recent edits
    const t = setInterval(fetchStatus, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={`sticky ${stickyOffset} z-40 -ml-4 md:-ml-9 pl-4 md:pl-9 flex items-center justify-between gap-3 py-3 px-2 md:px-4 border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 dark:border-slate-800`}
    >
      <Button
        variant="outline"
        size="icon"
        className="inline-flex dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <StackedBar className="h-5 w-5" />
      </Button>
      <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-lg">
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-full border border-transparent bg-violet-50 dark:bg-slate-800 dark:text-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button className="gap-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {percentUsed >= 90 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {percentUsed >= 90 ? (
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <p className="text-sm font-semibold text-amber-700">Budget Alert</p>
                <p className="text-xs text-muted-foreground">
                  Budget is {percentUsed.toFixed(1)}% used. Add more kWh to avoid running out.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {lastAlertSent
                    ? `Updated ${formatDistanceToNow(new Date(lastAlertSent), { addSuffix: true })}`
                    : "Just now"}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Go to dashboard
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-sm text-muted-foreground">
                No new notifications
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle compact />
        <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>
    </div>
  );
};

export default Navbar;
