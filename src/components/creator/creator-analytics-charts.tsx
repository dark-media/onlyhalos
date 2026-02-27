"use client";

// ============================================================================
// Creator Analytics Charts (recharts)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "7d" | "30d" | "90d" | "1y";

export interface CreatorAnalyticsChartsProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const GOLD = "#FFC700";
const GOLD_LIGHT = "#FFD740";
const AMBER = "#FFAB00";
const BRONZE = "#CD7F32";
const GRID_COLOR = "#2A2A36";
const AXIS_COLOR = "#5C5C6B";
const TOOLTIP_BG = "#1E1E28";
const TOOLTIP_BORDER = "#2A2A36";

const PIE_COLORS = [GOLD, AMBER, BRONZE];

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateEarningsData(period: Period) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const base = 120 + Math.sin(i * 0.15) * 40;
    const noise = Math.random() * 60 - 30;
    const trend = (days - i) * 0.5;

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(period === "1y" ? { year: "2-digit" } : {}),
      }),
      earnings: Math.max(0, Math.round((base + noise + trend) * 100) / 100),
    });
  }
  return data;
}

function generateSubscriberData(period: Period) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const data = [];
  const now = new Date();
  let subs = 800;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const growth = Math.floor(Math.random() * 8) - 1;
    subs = Math.max(0, subs + growth);

    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      subscribers: subs,
    });
  }
  return data;
}

const TOP_POSTS_DATA = [
  { title: "Sunday Worship Set", views: 4820, likes: 892 },
  { title: "Behind the Scenes", views: 3650, likes: 724 },
  { title: "Prayer Meditation", views: 3210, likes: 618 },
  { title: "Weekly Devotional", views: 2890, likes: 542 },
  { title: "Live Session Recap", views: 2340, likes: 456 },
  { title: "Scripture Art Print", views: 1980, likes: 398 },
];

const REVENUE_SOURCE_DATA = [
  { name: "Subscriptions", value: 2890 },
  { name: "Tips", value: 845 },
  { name: "PPV", value: 550 },
];

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border px-4 py-3 shadow-dark-lg"
      style={{
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
      }}
    >
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}:{" "}
          {entry.name.toLowerCase().includes("earning") ||
          entry.name.toLowerCase().includes("revenue")
            ? `$${entry.value.toLocaleString()}`
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div
      className="rounded-lg border px-4 py-3 shadow-dark-lg"
      style={{
        backgroundColor: TOOLTIP_BG,
        borderColor: TOOLTIP_BORDER,
      }}
    >
      <p className="text-sm font-semibold text-foreground">{entry.name}</p>
      <p className="text-xs text-muted-foreground">
        ${entry.value.toLocaleString()} ({(entry.payload.percent * 100).toFixed(0)}%)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period Selector
// ---------------------------------------------------------------------------

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const periods: { label: string; value: Period }[] = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
    { label: "1Y", value: "1y" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-dark-200 p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === p.value
              ? "bg-primary text-primary-foreground shadow-gold-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CreatorAnalyticsCharts({
  className,
}: CreatorAnalyticsChartsProps) {
  const [period, setPeriod] = useState<Period>("30d");

  const earningsData = useMemo(() => generateEarningsData(period), [period]);
  const subscriberData = useMemo(() => generateSubscriberData(period), [period]);

  // Only show every Nth tick to avoid crowding
  const tickInterval = period === "7d" ? 0 : period === "30d" ? 4 : period === "90d" ? 13 : 30;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Earnings Over Time */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_COLOR}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    name="Earnings"
                    stroke={GOLD}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: GOLD,
                      stroke: TOOLTIP_BG,
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Subscriber Growth */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Subscriber Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={subscriberData}>
                  <defs>
                    <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_COLOR}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="subscribers"
                    name="Subscribers"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#subGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Top Performing Posts */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOP_POSTS_DATA} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_COLOR}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    stroke={AXIS_COLOR}
                    tick={{ fill: AXIS_COLOR, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="views"
                    name="Views"
                    fill={GOLD}
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="likes"
                    name="Likes"
                    fill={AMBER}
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Revenue by Source (Donut) */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <div className="h-[220px] w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={REVENUE_SOURCE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {REVENUE_SOURCE_DATA.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {REVENUE_SOURCE_DATA.map((entry, idx) => {
                  const total = REVENUE_SOURCE_DATA.reduce((s, e) => s + e.value, 0);
                  const pct = Math.round((entry.value / total) * 100);
                  return (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx] }}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${entry.value.toLocaleString()} ({pct}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
