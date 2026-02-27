import {
  Home,
  Search,
  Bell,
  MessageSquare,
  User,
  Settings,
  LayoutDashboard,
  BarChart3,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  Flag,
  CreditCard,
  Layers,
  Heart,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Main Navigation (all authenticated users)
// ---------------------------------------------------------------------------

export const mainNavItems: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Explore", href: "/explore", icon: Search },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Subscriptions", href: "/subscriptions", icon: Heart },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Settings", href: "/settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Creator Sidebar
// ---------------------------------------------------------------------------

export const creatorSidebarSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/creator/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Posts", href: "/creator/posts", icon: FileText },
      { title: "Messages", href: "/creator/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Monetisation",
    items: [
      { title: "Earnings", href: "/creator/earnings", icon: DollarSign },
      { title: "Subscribers", href: "/creator/subscribers", icon: Users },
      { title: "Tiers", href: "/creator/tiers", icon: Layers },
      { title: "Payouts", href: "/creator/payouts", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", href: "/creator/settings", icon: Settings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Admin Sidebar
// ---------------------------------------------------------------------------

export const adminSidebarSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Creators", href: "/admin/creators", icon: ShieldCheck },
      { title: "Posts", href: "/admin/posts", icon: FileText },
      { title: "Reports", href: "/admin/reports", icon: Flag },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Revenue", href: "/admin/revenue", icon: DollarSign },
      { title: "Payouts", href: "/admin/payouts", icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
