"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Trophy,
  CalendarCheck,
  Phone,
  Mail,
  Users as UsersIcon,
  Handshake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatShortDate, stageBadgeColor, stageLabel, activityTypeLabel } from "@/lib/format";
import Link from "next/link";

interface DashboardData {
  openPipelineValue: number;
  dealsClosingThisMonth: number;
  wonThisMonth: { count: number; value: number };
  activitiesDueToday: number;
  pipelineByStage: Array<{ stage: string; count: number; totalValue: number }>;
  recentDeals: Array<{
    id: string;
    name: string;
    value: string;
    stage: string;
    expectedCloseDate: string;
    company: { id: string; name: string };
    owner: { firstName: string; lastName: string };
  }>;
  upcomingActivities: Array<{
    id: string;
    type: string;
    subject: string;
    dueDate: string;
    company?: { id: string; name: string } | null;
    contact?: { id: string; firstName: string; lastName: string } | null;
    deal?: { id: string; name: string } | null;
  }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  const json = await res.json();
  return json.data;
}

const activityIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: UsersIcon,
  FOLLOW_UP: CalendarCheck,
  DEMO: Handshake,
  TASK: CalendarCheck,
  PRESENTATION: Handshake,
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const maxStageValue = Math.max(
    ...data.pipelineByStage.map((s) => s.totalValue),
    1
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Pipeline"
          value={formatCurrency(data.openPipelineValue)}
          icon={DollarSign}
        />
        <MetricCard
          title="Closing This Month"
          value={String(data.dealsClosingThisMonth)}
          icon={TrendingUp}
          subtitle="open deals"
        />
        <MetricCard
          title="Won This Month"
          value={formatCurrency(data.wonThisMonth.value)}
          icon={Trophy}
          subtitle={`${data.wonThisMonth.count} deal${data.wonThisMonth.count !== 1 ? "s" : ""}`}
        />
        <MetricCard
          title="Due Today"
          value={String(data.activitiesDueToday)}
          icon={CalendarCheck}
          subtitle="activities"
        />
      </div>

      {/* Pipeline + Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pipelineByStage.map((stage) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stageLabel(stage.stage)}</span>
                    <span className="text-muted-foreground">
                      {stage.count} deal{stage.count !== 1 ? "s" : ""} &middot;{" "}
                      {formatCurrency(stage.totalValue)}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-indigo-500 transition-all"
                      style={{
                        width: `${(stage.totalValue / maxStageValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.pipelineByStage.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No open deals in pipeline
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingActivities.map((activity) => {
                const Icon = activityIcons[activity.type] || CalendarCheck;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-gray-100 p-1.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activityTypeLabel(activity.type)}
                        {activity.dueDate &&
                          ` · ${formatShortDate(activity.dueDate)}`}
                      </p>
                      {(activity.company || activity.contact || activity.deal) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {activity.deal?.name ||
                            activity.company?.name ||
                            (activity.contact
                              ? `${activity.contact.firstName} ${activity.contact.lastName}`
                              : "")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {data.upcomingActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No upcoming activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {deal.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/companies/${deal.company.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      {deal.company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(deal.value)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={stageBadgeColor(deal.stage)}
                    >
                      {stageLabel(deal.stage)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(deal.expectedCloseDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.owner.firstName} {deal.owner.lastName}
                  </TableCell>
                </TableRow>
              ))}
              {data.recentDeals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No deals yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-full bg-indigo-50 p-3">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
