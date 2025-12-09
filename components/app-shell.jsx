"use client";

import React from "react";
import { SignedIn } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Navbar from "@/app/(main)/dashboard/_components/Navbar";
import Sidebar from "@/app/(main)/dashboard/_components/Sidebar";
import { SidebarProvider } from "@/app/(main)/dashboard/_components/Sidebar/context";

const AppShell = ({ children }) => {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  if (isHome || isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 w-full min-h-screen">
        <SignedIn>
          <Sidebar />
        </SignedIn>
        <main
          className="flex flex-col w-full h-full pt-0 pb-7 px-4 md:px-9 bg-gray-50 dark:bg-slate-950"
        >
          <SignedIn>
            <Navbar />
          </SignedIn>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
