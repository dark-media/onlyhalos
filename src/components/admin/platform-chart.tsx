"use client";

// ============================================================================
// Platform Analytics Charts (Recharts)
// ============================================================================

import * as React from "react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueDataPoint {
  date: string;
  revenue: number;
  platformFees: number;
}

interface UserGrowthDataPoint {
  date: string;
  totalUsers: number;
  newUsers: number;
}

interface TierDistributionPoint {
  tier: string;
  subscribers: number;
  revenue: number;
}

interface ChartData {
  revenue: RevenueDataPoint[];
  userGrowth: UserGrowthDataPoint[];
  tierDistribution: TierDistributionPoint[];
}

// ---------------------------------------------------------------------------
// Shared Tooltip
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  gold: "hsl(45, 93%, 47%)",
  goldLight: "hsl(45, 93%, 60%)",
  blue: "hsl(217, 91%, 60%)",
  blueLight: "hsl(217, 91%, 75%)",
  emerald: "hsl(160, 84%, 39%)",
  muted: "hsl(240, 5%, 34%)",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-dark-lg">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {typeof entry.value === "number" && entry.name.toLowerCase().includes("revenue")
              ? `$${(entry.value / 100).toFixed(2)}`
              : typeof entry.value === "number" && entry.name.toLowerCase().includes("fee")
                ? `$${(entry.value / 100).toFixed(2)}`
                : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Chart
// ---------------------------------------------------------------------------

function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: CHART_COLORS.muted }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART_COLORS.gold}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.gold }}
        />
        <Line
          type="monotone"
          dataKey="platformFees"
          name="Platform Fees"
          stroke={CHART_COLORS.emerald}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.emerald }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// User Growth Chart
// ---------------------------------------------------------------------------

function UserGrowthChart({ data }: { data: UserGrowthDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="totalUsersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Area
          type="monotone"
          dataKey="totalUsers"
          name="Total Users"
          stroke={CHART_COLORS.blue}
          fill="url(#totalUsersGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="newUsers"
          name="New Users"
          stroke={CHART_COLORS.gold}
          fill="url(#newUsersGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Tier Distribution Chart
// ---------------------------------------------------------------------------

function TierDistributionChart({ data }: { data: TierDistributionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
        <XAxis
          dataKey="tier"
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={CHART_COLORS.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          yAxisId="left"
          dataKey="subscribers"
          name="Subscribers"
          fill={CHART_COLORS.gold}
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
        <Bar
          yAxisId="right"
          dataKey="revenue"
          name="Revenue"
          fill={CHART_COLORS.blue}
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PlatformChart() {
  const [data, setData] = React.useState<ChartData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/stats?charts=true");
        if (!res.ok) throw new Error("Failed to fetch chart data");
        const json = await res.json();
        setData({
          revenue: json.revenueChart ?? [],
          userGrowth: json.userGrowthChart ?? [],
          tierDistribution: json.tierDistributionChart ?? [],
        });
      } catch {
        toast.error("Failed to load chart data");
        // Set empty data so charts render empty instead of spinning forever
        setData({ revenue: [], userGrowth: [], tierDistribution: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Platform Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList variant="underline">
            <TabsTrigger value="revenue" variant="underline">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" variant="underline">
              User Growth
            </TabsTrigger>
            <TabsTrigger value="tiers" variant="underline">
              Tier Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-6">
            {data.revenue.length > 0 ? (
              <RevenueChart data={data.revenue} />
            ) : (
              <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                No revenue data available yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {data.userGrowth.length > 0 ? (
              <UserGrowthChart data={data.userGrowth} />
            ) : (
              <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                No user growth data available yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="tiers" className="mt-6">
            {data.tierDistribution.length > 0 ? (
              <TierDistributionChart data={data.tierDistribution} />
            ) : (
              <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                No tier distribution data available yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
