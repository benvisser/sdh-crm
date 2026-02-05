"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Plus,
  Phone,
  Mail,
  Users as UsersIcon,
  CalendarCheck,
  Handshake,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickAddActivity } from "@/components/forms/quick-add-activity";
import {
  formatDate,
  formatShortDate,
  activityTypeLabel,
  priorityColor,
} from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  duration: number | null;
  status: string;
  priority: string;
  companyId: string | null;
  contactId: string | null;
  dealId: string | null;
  assignedToId: string | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  deal?: { id: string; name: string } | null;
  assignedTo?: { firstName: string; lastName: string } | null;
}

interface ActivitiesResponse {
  data: Activity[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_CONFIG = [
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This Week" },
  { value: "completed", label: "Completed" },
] as const;

type TabValue = (typeof TAB_CONFIG)[number]["value"];

function buildQueryParams(tab: TabValue): string {
  const params = new URLSearchParams();

  switch (tab) {
    case "upcoming":
      params.set("status", "SCHEDULED");
      params.set("sort", "dueDate");
      break;
    case "all":
      // No filters
      break;
    case "overdue":
      params.set("status", "SCHEDULED");
      params.set("overdue", "true");
      break;
    case "today":
      params.set("dueDate", "today");
      break;
    case "thisWeek":
      params.set("dueDate", "thisWeek");
      break;
    case "completed":
      params.set("status", "COMPLETED");
      break;
  }

  return params.toString();
}

const activityIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: UsersIcon,
  TASK: CalendarCheck,
  FOLLOW_UP: CalendarCheck,
  DEMO: Handshake,
  PRESENTATION: Handshake,
};

function statusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
  };
  return labels[priority] || priority;
}

function isOverdue(activity: Activity): boolean {
  if (!activity.dueDate) return false;
  if (activity.status === "COMPLETED" || activity.status === "CANCELLED")
    return false;
  return new Date(activity.dueDate) < new Date();
}

function emptyStateMessage(tab: TabValue): { title: string; description: string } {
  switch (tab) {
    case "upcoming":
      return {
        title: "No upcoming activities",
        description: "All caught up! Create a new activity to stay on track.",
      };
    case "all":
      return {
        title: "No activities found",
        description: "Get started by logging your first activity.",
      };
    case "overdue":
      return {
        title: "No overdue activities",
        description: "Great job! You have no overdue activities.",
      };
    case "today":
      return {
        title: "Nothing due today",
        description: "You have no activities scheduled for today.",
      };
    case "thisWeek":
      return {
        title: "Nothing due this week",
        description: "You have no activities scheduled for this week.",
      };
    case "completed":
      return {
        title: "No completed activities",
        description: "Completed activities will appear here.",
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>("upcoming");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const queryParams = buildQueryParams(activeTab);

  const { data, isLoading } = useQuery<ActivitiesResponse>({
    queryKey: ["activities", activeTab],
    queryFn: async () => {
      const res = await fetch(
        `/api/activities${queryParams ? `?${queryParams}` : ""}`
      );
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const activities = data?.data ?? [];

  function handleQuickAddSuccess() {
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    toast.success("Activity created successfully");
  }

  async function handleComplete(activity: Activity) {
    setCompletingId(activity.id);
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to complete activity");
      }

      toast.success("Activity marked as completed");
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete activity"
      );
    } finally {
      setCompletingId(null);
    }
  }

  if (isLoading) {
    return <ActivitiesListSkeleton />;
  }

  const emptyState = emptyStateMessage(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-sm text-muted-foreground">
            Track calls, meetings, emails, and tasks
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Activity
        </Button>
      </div>

      {/* Tabs + Table */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
      >
        <TabsList variant="line">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="mt-4">
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                      <CalendarClock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">{emptyState.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {emptyState.description}
                    </p>
                    {(activeTab === "upcoming" || activeTab === "all") && (
                      <Button
                        className="mt-4"
                        onClick={() => setQuickAddOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Log Activity
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Related To</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => {
                        const Icon =
                          activityIcons[activity.type] || CalendarCheck;
                        const overdue = isOverdue(activity);

                        return (
                          <TableRow key={activity.id}>
                            {/* Type */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="rounded-md bg-gray-100 p-1.5">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {activityTypeLabel(activity.type)}
                                </span>
                              </div>
                            </TableCell>

                            {/* Subject */}
                            <TableCell>
                              <span className="font-medium">
                                {activity.subject}
                              </span>
                            </TableCell>

                            {/* Related To */}
                            <TableCell>
                              {activity.deal ? (
                                <Link
                                  href={`/deals/${activity.deal.id}`}
                                  className="text-indigo-600 hover:underline"
                                >
                                  {activity.deal.name}
                                </Link>
                              ) : activity.company ? (
                                <Link
                                  href={`/companies/${activity.company.id}`}
                                  className="text-indigo-600 hover:underline"
                                >
                                  {activity.company.name}
                                </Link>
                              ) : activity.contact ? (
                                <Link
                                  href={`/contacts/${activity.contact.id}`}
                                  className="text-indigo-600 hover:underline"
                                >
                                  {activity.contact.firstName}{" "}
                                  {activity.contact.lastName}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>

                            {/* Due Date */}
                            <TableCell>
                              {activity.dueDate ? (
                                <span
                                  className={
                                    overdue
                                      ? "font-medium text-red-600"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {formatShortDate(activity.dueDate)}
                                  {overdue && (
                                    <span className="ml-1 text-xs">
                                      (overdue)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  --
                                </span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={statusBadgeColor(activity.status)}
                              >
                                {statusLabel(activity.status)}
                              </Badge>
                            </TableCell>

                            {/* Priority */}
                            <TableCell>
                              <span
                                className={`text-sm font-medium ${priorityColor(
                                  activity.priority
                                )}`}
                              >
                                {priorityLabel(activity.priority)}
                              </span>
                            </TableCell>

                            {/* Assigned To */}
                            <TableCell className="text-muted-foreground">
                              {activity.assignedTo
                                ? `${activity.assignedTo.firstName} ${activity.assignedTo.lastName}`
                                : "--"}
                            </TableCell>

                            {/* Complete Action */}
                            <TableCell>
                              {activity.status === "SCHEDULED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={completingId === activity.id}
                                  onClick={() => handleComplete(activity)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  {completingId === activity.id
                                    ? "..."
                                    : "Complete"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Add Dialog */}
      <QuickAddActivity
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ActivitiesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Tab skeleton */}
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
