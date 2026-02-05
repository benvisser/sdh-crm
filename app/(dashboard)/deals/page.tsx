"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Handshake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatShortDate,
  formatDate,
  stageBadgeColor,
  stageLabel,
  getInitials,
} from "@/lib/format";
import { QuickAddDeal } from "@/components/forms/quick-add-deal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Deal {
  id: string;
  name: string;
  value: string;
  currency: string;
  probability: number;
  weightedValue: string;
  stage: string;
  expectedCloseDate: string;
  actualCloseDate: string | null;
  closedStatus: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string };
  owner: { id: string; firstName: string; lastName: string; email: string };
}

interface DealsResponse {
  data: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const LIST_PAGE_SIZE = 25;

async function fetchDeals(opts?: {
  page?: number;
  limit?: number;
  stage?: string;
  ownerId?: string;
}): Promise<DealsResponse> {
  const params = new URLSearchParams();
  params.set("page", String(opts?.page ?? 1));
  params.set("limit", String(opts?.limit ?? 100));
  if (opts?.stage && opts.stage !== "ALL") {
    params.set("stage", opts.stage);
  }
  if (opts?.ownerId) {
    params.set("ownerId", opts.ownerId);
  }
  const res = await fetch(`/api/deals?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load deals");
  return res.json();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  "INQUIRY",
  "DISCOVERY_CALL_SCHEDULED",
  "PROPOSAL_NEEDED",
  "PROPOSAL_SENT",
  "PROPOSAL_REVIEWED",
  "DECISION_MAKER",
  "NEGOTIATION",
  "CONTRACT",
] as const;

const ALL_STAGES = [
  "INQUIRY",
  "DISCOVERY_CALL_SCHEDULED",
  "PROPOSAL_NEEDED",
  "PROPOSAL_SENT",
  "PROPOSAL_REVIEWED",
  "DECISION_MAKER",
  "NEGOTIATION",
  "CONTRACT",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

type SortField =
  | "name"
  | "company"
  | "value"
  | "stage"
  | "probability"
  | "expectedCloseDate"
  | "owner"
  | "updatedAt";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DealsPage() {
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data: dealsData } = useQuery({
    queryKey: ["deals", "pipeline"],
    queryFn: () => fetchDeals(),
  });

  const totalDeals = dealsData?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Deals</h1>
          {totalDeals > 0 && (
            <Badge variant="secondary" className="text-sm">
              {totalDeals}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-background p-0.5">
            <Button
              variant={view === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("pipeline")}
              className="gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="gap-1.5"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>

          <Button onClick={() => setQuickAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {view === "pipeline" ? <PipelineView /> : <ListView />}

      <QuickAddDeal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={() => setQuickAddOpen(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline View
// ---------------------------------------------------------------------------

function PipelineView() {
  const { data, isLoading } = useQuery({
    queryKey: ["deals", "pipeline"],
    queryFn: () => fetchDeals(),
  });

  if (isLoading) return <PipelineSkeleton />;

  const deals = data?.data ?? [];
  const openDeals = deals.filter(
    (d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST"
  );

  const columns = PIPELINE_STAGES.map((stage) => {
    const stageDeals = openDeals.filter((d) => d.stage === stage);
    const totalValue = stageDeals.reduce(
      (sum, d) => sum + parseFloat(d.value),
      0
    );
    return { stage, deals: stageDeals, totalValue };
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.stage} className="flex flex-col">
          {/* Column header */}
          <div className="mb-3 rounded-lg bg-white p-3 shadow-sm border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{stageLabel(col.stage)}</h3>
              <Badge variant="secondary" className="text-xs">
                {col.deals.length}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(col.totalValue)}
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2">
            {col.deals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-3">
                    <p className="truncate text-sm font-medium">{deal.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.company.name}
                    </p>
                    <p className="mt-1.5 text-sm font-bold">
                      {formatCurrency(deal.value)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(deal.expectedCloseDate)}
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-medium text-indigo-700">
                        {getInitials(deal.owner.firstName, deal.owner.lastName)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {col.deals.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                <Handshake className="mb-2 h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No deals</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function ListView() {
  const [stageFilter, setStageFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["deals", "list", page, stageFilter, ownerFilter],
    queryFn: () =>
      fetchDeals({
        page,
        limit: LIST_PAGE_SIZE,
        stage: stageFilter !== "ALL" ? stageFilter : undefined,
        ownerId: ownerFilter || undefined,
      }),
  });

  // Fetch all owners for the filter dropdown (lightweight query)
  const { data: allDealsData } = useQuery({
    queryKey: ["deals", "owners"],
    queryFn: () => fetchDeals({ limit: 100 }),
  });

  const stageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal stage updated");
    },
    onError: () => {
      toast.error("Failed to update deal stage");
    },
  });

  const deals = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  // Collect unique owners from full dataset for the filter
  const owners = useMemo(() => {
    const allDeals = allDealsData?.data ?? [];
    const map = new Map<string, { id: string; name: string }>();
    allDeals.forEach((d) => {
      if (!map.has(d.owner.id)) {
        map.set(d.owner.id, {
          id: d.owner.id,
          name: `${d.owner.firstName} ${d.owner.lastName}`,
        });
      }
    });
    return Array.from(map.values());
  }, [allDealsData]);

  // Sort current page client-side
  const sorted = useMemo(() => {
    const arr = [...deals];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "company":
          cmp = a.company.name.localeCompare(b.company.name);
          break;
        case "value":
          cmp = parseFloat(a.value) - parseFloat(b.value);
          break;
        case "stage":
          cmp = a.stage.localeCompare(b.stage);
          break;
        case "probability":
          cmp = a.probability - b.probability;
          break;
        case "expectedCloseDate":
          cmp =
            new Date(a.expectedCloseDate).getTime() -
            new Date(b.expectedCloseDate).getTime();
          break;
        case "owner":
          cmp = `${a.owner.firstName} ${a.owner.lastName}`.localeCompare(
            `${b.owner.firstName} ${b.owner.lastName}`
          );
          break;
        case "updatedAt":
          cmp =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [deals, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  if (isLoading) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stages</SelectItem>
            {ALL_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {stageLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ownerFilter || "ALL"}
          onValueChange={(v) => {
            setOwnerFilter(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Owners</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  Deal Name <SortIcon field="name" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("company")}
                >
                  Company <SortIcon field="company" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("value")}
                >
                  Value <SortIcon field="value" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("stage")}
                >
                  Stage <SortIcon field="stage" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("probability")}
                >
                  Probability <SortIcon field="probability" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("expectedCloseDate")}
                >
                  Expected Close <SortIcon field="expectedCloseDate" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("owner")}
                >
                  Owner <SortIcon field="owner" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("updatedAt")}
                >
                  Last Updated <SortIcon field="updatedAt" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((deal) => (
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
                    <Select
                      value={deal.stage}
                      onValueChange={(newStage) => {
                        if (newStage !== deal.stage) {
                          stageMutation.mutate({ dealId: deal.id, stage: newStage });
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 shadow-none focus:ring-0">
                        <Badge
                          variant="secondary"
                          className={stageBadgeColor(deal.stage)}
                        >
                          {stageLabel(deal.stage)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {stageLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.probability}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(deal.expectedCloseDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.owner.firstName} {deal.owner.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(deal.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}

              {sorted.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Handshake className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p>No deals found</p>
                    <p className="text-sm">
                      Try adjusting your filters or create a new deal.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIST_PAGE_SIZE + 1}–
            {Math.min(page * LIST_PAGE_SIZE, total)} of {total} deals
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function PipelineSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="rounded-lg border bg-white p-3">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          {[...Array(3)].map((_, j) => (
            <Card key={j}>
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-16" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
