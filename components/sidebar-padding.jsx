"use client";

import { useSidebar } from "@/app/(main)/dashboard/_components/Sidebar/context";

export default function SidebarPadding({ children }) {
  const { isCollapsed } = useSidebar();
  // Apply left padding only on md+ to make room for the sidebar
  const pad = isCollapsed ? "md:pl-24" : "md:pl-72";
  return <div className={pad}>{children}</div>;
}

