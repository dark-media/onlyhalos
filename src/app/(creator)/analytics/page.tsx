"use client";

// ============================================================================
// Analytics Page - Full analytics with charts and breakdowns
// ============================================================================

import React, { useState } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorAnalyticsCharts } from "@/components/creator/creator-analytics-charts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Key Metrics
// ---------------------------------------------------------------------------

interface KeyMetric {
  label: string;
  value: string;
  trend: number;
  icon: React.ElementType;
}

const KEY_METRICS: KeyMetric[] = [
  { label: "Total Views", value: "148.2K", trend: 14.2, icon: Eye },
  { label: "Total Likes", value: "32.4K", trend: 8.7, icon: Heart },
  { label: "Comments", value: "4,821", trend: -3.1, icon: MessageCircle },
  { label: "Shares", value: "1,247", trend: 22.5, icon: Share2 },
  { label: "New Subscribers", value: "186", trend: 11.3, icon: Users },
  { label: "Revenue", value: "$12,847", trend: 18.2, icon: DollarSign },
];

// ---------------------------------------------------------------------------
// Breakdown Tables
// ---------------------------------------------------------------------------

const CONTENT_BREAKDOWN = [
  { type: "Photos", posts: 189, views: "68.4K", engagement: "28.2%", revenue: "$4,820" },
  { type: "Videos", posts: 87, views: "52.1K", engagement: "32.4%", revenue: "$5,140" },
  { type: "Text Posts", posts: 42, views: "18.3K", engagement: "15.6%", revenue: "$1,890" },
  { type: "PPV Content", posts: 24, views: "9.4K", engagement: "42.1%", revenue: "$997" },
];

const GEO_BREAKDOWN = [
  { country: "United States", subscribers: 842, percentage: "65.6%" },
  { country: "United Kingdom", subscribers: 156, percentage: "12.1%" },
  { country: "Canada", subscribers: 98, percentage: "7.6%" },
  { country: "Australia", subscribers: 72, percentage: "5.6%" },
  { country: "Germany", subscribers: 48, percentage: "3.7%" },
  { country: "Other", subscribers: 68, percentage: "5.4%" },
];

const TOP_REFERRERS = [
  { source: "Direct / Bookmark", visits: "12,482", conversions: 342 },
  { source: "Twitter / X", visits: "8,241", conversions: 186 },
  { source: "Instagram", visits: "5,120", conversions: 94 },
  { source: "TikTok", visits: "3,890", conversions: 78 },
  { source: "Google Search", visits: "2,140", conversions: 52 },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track your performance, audience growth, and content engagement.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {KEY_METRICS.map((metric) => {
          const isPositive = metric.trend >= 0;
          return (
            <Card key={metric.label} variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">
                  {metric.value}
                </p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs font-medium",
                    isPositive ? "text-halo-gold" : "text-destructive",
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {metric.trend}%
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <CreatorAnalyticsCharts />

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Content Performance */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Posts</th>
                    <th className="pb-3 pr-4 font-medium">Views</th>
                    <th className="pb-3 pr-4 font-medium">Engagement</th>
                    <th className="pb-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {CONTENT_BREAKDOWN.map((row) => (
                    <tr key={row.type}>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {row.type}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.posts}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.views}
                      </td>
                      <td className="py-3 pr-4 text-halo-gold">
                        {row.engagement}
                      </td>
                      <td className="py-3 font-medium text-foreground">
                        {row.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Audience Geography */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Audience Geography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Country</th>
                    <th className="pb-3 pr-4 font-medium">Subscribers</th>
                    <th className="pb-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {GEO_BREAKDOWN.map((row) => (
                    <tr key={row.country}>
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {row.country}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.subscribers.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-dark-300">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: row.percentage,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {row.percentage}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Referral Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Source</th>
                    <th className="pb-3 pr-4 font-medium">Profile Visits</th>
                    <th className="pb-3 pr-4 font-medium">Conversions</th>
                    <th className="pb-3 font-medium">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {TOP_REFERRERS.map((row) => {
                    const visits = parseInt(row.visits.replace(/,/g, ""));
                    const rate = ((row.conversions / visits) * 100).toFixed(1);
                    return (
                      <tr key={row.source}>
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {row.source}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {row.visits}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {row.conversions}
                        </td>
                        <td className="py-3 font-medium text-halo-gold">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
