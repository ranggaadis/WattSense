"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Gauge,
  LineChart,
  CircleDollarSign,
  Waves,
} from "lucide-react";
import { useSidebar } from "./context";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";

const Sidebar = () => {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/voltage", label: "Voltage", icon: Zap },
    { href: "/ampere", label: "Ampere", icon: Activity },
    { href: "/power", label: "Power", icon: Gauge },
    { href: "/energy", label: "Energy", icon: LineChart },
    { href: "/power-factor", label: "Power Factor", icon: Waves },
    { href: "/price", label: "Price", icon: CircleDollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <aside
        className={`sticky left-0 top-0 h-[calc(100dvh)] bg-white dark:bg-slate-900 border-r dark:border-slate-800 z-30 transition-all duration-300 ease-in-out shrink-0
        ${isCollapsed ? "w-16" : "w-64"} md:${isCollapsed ? "w-16" : "w-72"}
        `}
      >
        <div className={`${isCollapsed ? "px-0" : "px-4"} py-3 border-b dark:border-slate-800`}> 
          <div
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            {isCollapsed ? (
              <>
                <Image
                  src="/logo-sm.png"
                  alt="WattSense logo"
                  width={32}
                  height={32}
                  className="block dark:hidden h-8 w-8 object-contain"
                />
                <Image
                  src="/logodarkmode-sm.png"
                  alt="WattSense logo"
                  width={32}
                  height={32}
                  className="hidden dark:block h-8 w-8 object-contain"
                />
              </>
            ) : (
              <>
                <Image
                  src="/logo.png"
                  alt="WattSense logo"
                  width={40}
                  height={40}
                  className="block dark:hidden h-10 w-auto object-contain"
                />
                <Image
                  src="/logodarkmode.png"
                  alt="WattSense dark logo"
                  width={40}
                  height={40}
                  className="hidden dark:block h-10 w-auto object-contain"
                />
                <span className="font-semibold text-lg whitespace-nowrap">WattSense</span>
              </>
            )}
          </div>
        </div>

        {/* Sidebar content (nav items) can be added here */}
        {user && (
          <div className={`px-3 py-3 border-b ${isCollapsed ? "justify-center" : ""}`}>
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="h-9 w-9 rounded-full object-cover"
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName || user.username || user.primaryEmailAddress?.emailAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className={`${isCollapsed ? "px-0" : "px-2"} py-2 flex-1`}
          style={{ minHeight: 0 }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={`w-full ${isCollapsed ? "justify-center" : "justify-start"} mb-1 ${
                  isCollapsed ? "px-2" : "px-3"
                }`}
              >
                <Link href={href} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className={`mt-auto p-2 border-t dark:border-slate-800 ${isCollapsed ? "px-2" : "px-2"} ${isCollapsed ? "flex justify-center" : ""}`}>
          <ThemeToggle compact={isCollapsed} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
