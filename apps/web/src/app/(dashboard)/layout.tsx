"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Headphones,
  Inbox,
  CircleDot,
  Clock,
  CheckCircle2,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/tickets", label: "Inbox", icon: Inbox },
  { href: "/tickets?status=open", label: "Open", icon: CircleDot },
  { href: "/tickets?status=pending", label: "Pending", icon: Clock },
  { href: "/tickets?status=resolved", label: "Resolved", icon: CheckCircle2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  function isActive(href: string) {
    if (href === "/tickets") {
      return pathname === "/tickets" || pathname === "/dashboard";
    }
    return pathname.startsWith(href.split("?")[0]) && !href.includes("?");
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">SupportKit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                active
                  ? "bg-violet-600/20 text-violet-400 border-l-2 border-violet-500 pl-[10px]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-violet-600/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-violet-300">
              {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <span className="text-xs text-gray-400 truncate flex-1 min-w-0">
            {session?.user?.email ?? "Loading..."}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111] border-r border-white/10 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#111111] border-r border-white/10 flex flex-col">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111111]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">SupportKit</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
