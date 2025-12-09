"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sidebar:collapsed");
      if (saved !== null) setIsCollapsed(saved === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("sidebar:collapsed", isCollapsed ? "1" : "0");
    } catch {}
  }, [isCollapsed]);

  const toggleCollapsed = () => setIsCollapsed((v) => !v);
  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleMobile = () => setIsMobileOpen((v) => !v);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, toggleCollapsed, isMobileOpen, openMobile, closeMobile, toggleMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

