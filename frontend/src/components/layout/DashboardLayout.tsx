"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  UserPlus,
  Calendar,
  BookOpen,
  Layers,
  FileSpreadsheet,
  Clock,
  Award,
  DollarSign,
  LogOut,
  Bell,
  MessageSquare,
  ShieldCheck,
  Menu,
  X,
  User,
  Search,
  ChevronDown,
  BarChart3,
  Bus,
  Command,
} from "lucide-react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Audit Logs", href: "/audit-logs", icon: ShieldCheck },
    ],
  },
  {
    title: "Academic Core",
    items: [
      { label: "Classes & Sections", href: "/academics/classes", icon: Layers },
      { label: "Subjects", href: "/academics/subjects", icon: BookOpen },
      { label: "Academic Years", href: "/academics/years", icon: Calendar },
      { label: "Timetable", href: "/timetable", icon: FileSpreadsheet },
      { label: "Exams & Grades", href: "/examinations", icon: Award },
    ],
  },
  {
    title: "People & Portals",
    items: [
      { label: "Students", href: "/students", icon: GraduationCap },
      { label: "Teachers", href: "/teachers", icon: UserCheck },
      { label: "Parents", href: "/parents", icon: Users },
      { label: "Admissions", href: "/admissions", icon: UserPlus, badge: "New" },
      { label: "Attendance", href: "/attendance", icon: Clock },
      { label: "Leave Requests", href: "/leaves", icon: UserCheck },
    ],
  },
  {
    title: "Portals",
    items: [
      { label: "Student Portal", href: "/portal/student", icon: GraduationCap },
      { label: "Teacher Portal", href: "/portal/teacher", icon: UserCheck },
      { label: "Parent Portal", href: "/portal/parent", icon: Users },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Fees & Finances", href: "/fees", icon: DollarSign },
      { label: "Noticeboard", href: "/communication", icon: MessageSquare },
      { label: "Events & Calendar", href: "/events", icon: Calendar },
      { label: "Certificates", href: "/certificates", icon: Award },
      { label: "Transport & Fleet", href: "/transport", icon: Bus },
      { label: "Reports System", href: "/reports", icon: FileSpreadsheet },
      { label: "System Settings", href: "/settings/users", icon: ShieldCheck },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setCurrentUser(res.data))
      .catch((err: any) => {
        // Only force-logout on real authentication failures (401/403).
        // Transient network issues should not kick the user out.
        const status = err?.response?.status;
        if (status === 401 || status === 403 || !localStorage.getItem("access_token")) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      });
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore logout API errors
    } finally {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  const getCurrentPageTitle = () => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) {
          return { section: section.title, page: item.label };
        }
      }
    }
    return { section: "Platform", page: "Overview" };
  };

  const breadcrumb = getCurrentPageTitle();

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)] text-[var(--text-primary)] font-sans transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] p-4 space-y-4 shrink-0 shadow-lg relative z-20">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-2 py-2.5 border-b border-[var(--border-color)]">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-heading font-black text-white text-xs shadow-md shadow-blue-500/20">
            SMS
          </div>
          <div className="overflow-hidden">
            <h1 className="font-heading font-bold text-sm text-[var(--text-primary)] tracking-wide flex items-center space-x-1.5">
              <span>Horizon ERP</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">Enterprise Suite v2.4</p>
          </div>
        </div>

        {/* Quick Menu Search */}
        <div className="px-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter menu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pl-8 pr-3 py-1.5 focus:border-blue-500 focus:outline-none transition-all placeholder:text-[var(--text-muted)]"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Categorized Nav Items */}
        <nav className="flex-1 space-y-4 overflow-y-auto pr-1 text-xs">
          {navSections.map((section) => {
            const filteredItems = section.items.filter((item) =>
              item.label.toLowerCase().includes(searchFilter.toLowerCase())
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {section.title}
                </div>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group ${
                        active
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            active ? "text-white" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-[var(--border-color)] pt-3 px-1 space-y-2">
          {currentUser && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)]">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.first_name?.[0] || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] capitalize truncate">
                    {currentUser.roles?.[0]?.name || "Administrator"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 max-w-xs bg-[var(--bg-surface)] p-4 space-y-4 border-r border-[var(--border-color)] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  SMS
                </div>
                <span className="font-heading font-bold text-sm text-[var(--text-primary)]">Horizon ERP</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto text-xs">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          active
                            ? "bg-blue-600 text-white font-semibold shadow-md"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Header */}
        <header className="h-16 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
          {/* Left: Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="text-[var(--text-muted)] font-medium">{breadcrumb.section}</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="font-semibold text-[var(--text-primary)] font-heading tracking-wide">{breadcrumb.page}</span>
            </div>
          </div>

          {/* Center: Global Search input with shortcut hint */}
          <div className="relative hidden md:block w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search students, staff, classes..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pl-9 pr-14 py-2 focus:border-blue-500 focus:outline-none transition-all placeholder:text-[var(--text-muted)]"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>

          {/* Right Header Controls: Academic Year, Theme Toggle, Notifications, User Profile */}
          <div className="flex items-center space-x-3">
            {/* Academic Year Tag */}
            <div className="hidden md:flex items-center space-x-2 text-[11px] status-badge-success px-3 py-1.5 rounded-full font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AY 2026–2027</span>
            </div>

            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-xl transition border border-[var(--border-color)]"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-[var(--bg-surface)]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 glass-panel p-3 rounded-2xl shadow-xl border border-[var(--border-color)] z-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                    <span className="font-semibold text-[var(--text-primary)]">Notifications</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Mark all read</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[11px]">
                      <p className="font-medium text-[var(--text-primary)]">New Admission Request</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Sarah Jenkins submitted form #ADM-904</p>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[11px]">
                      <p className="font-medium text-[var(--text-primary)]">Exam Results Published</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Grade 10 Mid-term exams available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] transition"
                >
                  <div className="text-right hidden sm:block text-xs">
                    <span className="block font-semibold text-[var(--text-primary)] leading-tight">
                      {currentUser.first_name} {currentUser.last_name}
                    </span>
                    <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-medium capitalize">
                      {currentUser.roles?.[0]?.name || "Admin"}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
                    {currentUser.first_name?.[0] || "A"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel p-2 rounded-2xl shadow-xl border border-[var(--border-color)] z-50 space-y-1 text-xs">
                    <div className="px-3 py-2 border-b border-[var(--border-color)]">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {currentUser.first_name} {currentUser.last_name}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{currentUser.email}</p>
                    </div>
                    <Link
                      href="/settings/users"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                    >
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Account Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
