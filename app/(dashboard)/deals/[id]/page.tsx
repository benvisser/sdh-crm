"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  History,
  MessageSquare,
  Plus,
  Search,
  User,
  Users,
  ArrowRight,
  Briefcase,
  Percent,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  formatDateInput,
  stageBadgeColor,
  stageLabel,
  getInitials,
  fullName,
  activityTypeLabel,
} from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DealContact {
  id: string;
  role: string;
  isPrimary: boolean;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    jobTitle: string | null;
  };
}

interface StageHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedAt: string;
}

interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

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
  lostReason: string | null;
  lostReasonNote: string | null;
  projectType: string | null;
  estimatedHours: number | null;
  source: string | null;
  stageChangedAt: string;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string };
  owner: { id: string; firstName: string; lastName: string; email: string };
  contacts: DealContact[];
  notes: Note[];
  stageHistory: StageHistoryEntry[];
}

interface SearchContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_STAGES = [
  { value: "INQUIRY", label: "Inquiry" },
  { value: "DISCOVERY_CALL_SCHEDULED", label: "Discovery Call Scheduled" },
  { value: "PROPOSAL_NEEDED", label: "Proposal Needed" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "PROPOSAL_REVIEWED", label: "Proposal Reviewed" },
  { value: "DECISION_MAKER", label: "With Decision Maker" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONTRACT", label: "Contract" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const LOST_REASONS = [
  { value: "PRICE", label: "Price" },
  { value: "TIMING", label: "Timing" },
  { value: "COMPETITOR", label: "Competitor" },
  { value: "NO_BUDGET", label: "No Budget" },
  { value: "NO_DECISION", label: "No Decision" },
  { value: "WENT_SILENT", label: "Went Silent" },
  { value: "NOT_A_FIT", label: "Not a Fit" },
  { value: "OTHER", label: "Other" },
];

const CONTACT_ROLES = [
  { value: "DECISION_MAKER", label: "Decision Maker" },
  { value: "INFLUENCER", label: "Influencer" },
  { value: "CHAMPION", label: "Champion" },
  { value: "STAKEHOLDER", label: "Stakeholder" },
  { value: "BLOCKER", label: "Blocker" },
  { value: "END_USER", label: "End User" },
];

function roleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    DECISION_MAKER: "bg-red-100 text-red-800",
    INFLUENCER: "bg-purple-100 text-purple-800",
    CHAMPION: "bg-green-100 text-green-800",
    STAKEHOLDER: "bg-blue-100 text-blue-800",
    BLOCKER: "bg-orange-100 text-orange-800",
    END_USER: "bg-gray-100 text-gray-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

function roleLabel(role: string): string {
  return CONTACT_ROLES.find((r) => r.value === role)?.label || role;
}

function projectTypeLabel(type: string | null): string {
  if (!type) return "--";
  const labels: Record<string, string> = {
    BRANDING: "Branding",
    WEB_DESIGN: "Web Design",
    WEB_DEVELOPMENT: "Web Development",
    MOBILE_APP: "Mobile App",
    UI_UX: "UI/UX",
    PRINT: "Print",
    MARKETING: "Marketing",
    VIDEO: "Video",
    PHOTOGRAPHY: "Photography",
    OTHER: "Other",
  };
  return labels[type] || type;
}

function sourceLabel(source: string | null): string {
  if (!source) return "--";
  const labels: Record<string, string> = {
    WEBSITE: "Website",
    REFERRAL: "Referral",
    COLD_OUTREACH: "Cold Outreach",
    LINKEDIN: "LinkedIn",
    CONFERENCE: "Conference",
    INBOUND_CALL: "Inbound Call",
    PARTNER: "Partner",
    ADVERTISING: "Advertising",
    CONTENT: "Content",
    OTHER: "Other",
  };
  return labels[source] || source;
}

function lostReasonLabel(reason: string | null): string {
  if (!reason) return "--";
  return LOST_REASONS.find((r) => r.value === reason)?.label || reason;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchDeal(id: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${id}`);
  if (!res.ok) throw new Error("Failed to load deal");
  const json = await res.json();
  return json.data;
}

async function fetchDealNotes(
  id: string
): Promise<{ data: Note[]; pagination: { total: number } }> {
  const res = await fetch(`/api/deals/${id}/notes?limit=100`);
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

async function fetchDealActivities(id: string): Promise<Activity[]> {
  const res = await fetch(`/api/activities?dealId=${id}&limit=100`);
  if (!res.ok) throw new Error("Failed to load activities");
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useQuery({
    queryKey: ["deal", id],
    queryFn: () => fetchDeal(id),
    enabled: !!id,
  });

  // Lost reason dialog state
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [lostReasonNote, setLostReasonNote] = useState("");
  const [pendingStage, setPendingStage] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Auto-save field mutation (general PATCH)
  // -----------------------------------------------------------------------
  const patchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to update deal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // -----------------------------------------------------------------------
  // Stage change mutation (dedicated endpoint)
  // -----------------------------------------------------------------------
  const stageMutation = useMutation({
    mutationFn: async (data: {
      stage: string;
      lostReason?: string;
      lostReasonNote?: string;
    }) => {
      const res = await fetch(`/api/deals/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to update stage");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Stage updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // -----------------------------------------------------------------------
  // Stage change handler
  // -----------------------------------------------------------------------
  function handleStageChange(newStage: string) {
    if (!deal || newStage === deal.stage) return;

    if (newStage === "CLOSED_WON") {
      stageMutation.mutate({ stage: "CLOSED_WON" });
    } else if (newStage === "CLOSED_LOST") {
      setPendingStage("CLOSED_LOST");
      setLostReason("");
      setLostReasonNote("");
      setLostDialogOpen(true);
    } else {
      // For open stages, use the dedicated stage endpoint too
      stageMutation.mutate({ stage: newStage });
    }
  }

  function handleLostConfirm() {
    if (!lostReason) {
      toast.error("Please select a reason");
      return;
    }
    stageMutation.mutate({
      stage: "CLOSED_LOST",
      lostReason,
      lostReasonNote: lostReasonNote || undefined,
    });
    setLostDialogOpen(false);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (isLoading) return <DealDetailSkeleton />;
  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Deal not found</p>
        <Link href="/deals">
          <Button variant="link">Back to Deals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <Link
          href="/deals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(deal.value)}
              </span>
              <Badge
                variant="secondary"
                className={stageBadgeColor(deal.stage)}
              >
                {stageLabel(deal.stage)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {deal.probability}% probability
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-edit fields */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Stage */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stage</Label>
              <Select value={deal.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className="pl-7"
                  defaultValue={parseFloat(deal.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val !== parseFloat(deal.value)) {
                      patchMutation.mutate({ value: val });
                    }
                  }}
                />
              </div>
            </div>

            {/* Probability */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Probability
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="pr-7"
                  defaultValue={deal.probability}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val !== deal.probability) {
                      patchMutation.mutate({
                        probability: Math.min(100, Math.max(0, val)),
                      });
                    }
                  }}
                />
                <span className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  %
                </span>
              </div>
            </div>

            {/* Expected close */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Expected Close
              </Label>
              <Input
                type="date"
                defaultValue={formatDateInput(deal.expectedCloseDate)}
                onBlur={(e) => {
                  if (
                    e.target.value &&
                    e.target.value !== formatDateInput(deal.expectedCloseDate)
                  ) {
                    patchMutation.mutate({
                      expectedCloseDate: e.target.value,
                    });
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab deal={deal} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab dealId={id} contacts={deal.contacts} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab dealId={id} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesTab dealId={id} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab history={deal.stageHistory} />
        </TabsContent>
      </Tabs>

      {/* Lost reason dialog */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Closed Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {LOST_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={lostReasonNote}
                onChange={(e) => setLostReasonNote(e.target.value)}
                placeholder="Additional context..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLostDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLostConfirm}
              disabled={stageMutation.isPending}
            >
              {stageMutation.isPending ? "Saving..." : "Mark as Lost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------

function DetailsTab({ deal }: { deal: Deal }) {
  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <DetailRow
            icon={Building2}
            label="Company"
            value={
              <Link
                href={`/companies/${deal.company.id}`}
                className="text-indigo-600 hover:underline"
              >
                {deal.company.name}
              </Link>
            }
          />
          <DetailRow
            icon={User}
            label="Owner"
            value={fullName(deal.owner.firstName, deal.owner.lastName)}
          />
          <DetailRow
            icon={Briefcase}
            label="Project Type"
            value={projectTypeLabel(deal.projectType)}
          />
          <DetailRow
            icon={Clock}
            label="Estimated Hours"
            value={deal.estimatedHours ? `${deal.estimatedHours} hrs` : "--"}
          />
          <DetailRow
            icon={FileText}
            label="Source"
            value={sourceLabel(deal.source)}
          />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={formatShortDate(deal.createdAt)}
          />
          <DetailRow
            icon={History}
            label="Stage Changed"
            value={formatDate(deal.stageChangedAt)}
          />
          <DetailRow
            icon={DollarSign}
            label="Weighted Value"
            value={formatCurrency(deal.weightedValue)}
          />

          {deal.closedStatus && (
            <>
              <DetailRow
                icon={Calendar}
                label="Closed Status"
                value={
                  <Badge
                    variant="secondary"
                    className={
                      deal.closedStatus === "WON"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {deal.closedStatus}
                  </Badge>
                }
              />
              <DetailRow
                icon={Calendar}
                label="Closed Date"
                value={
                  deal.actualCloseDate
                    ? formatShortDate(deal.actualCloseDate)
                    : "--"
                }
              />
            </>
          )}

          {deal.closedStatus === "LOST" && (
            <>
              <DetailRow
                icon={FileText}
                label="Lost Reason"
                value={lostReasonLabel(deal.lostReason)}
              />
              {deal.lostReasonNote && (
                <DetailRow
                  icon={MessageSquare}
                  label="Lost Reason Note"
                  value={deal.lostReasonNote}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md bg-gray-100 p-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contacts Tab
// ---------------------------------------------------------------------------

function ContactsTab({
  dealId,
  contacts,
}: {
  dealId: string;
  contacts: DealContact[];
}) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchContact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedRole, setSelectedRole] = useState("STAKEHOLDER");

  // Search contacts
  useEffect(() => {
    if (!addDialogOpen || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/contacts?search=${encodeURIComponent(searchQuery)}&limit=10`
        );
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : [];
          setSearchResults(list);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, addDialogOpen]);

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          role: selectedRole,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to add contact");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast.success("Contact added to deal");
      setAddDialogOpen(false);
      setSearchQuery("");
      setSelectedContactId("");
      setSelectedRole("STAKEHOLDER");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Contacts</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddDialogOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No contacts linked to this deal yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((dc) => (
              <div
                key={dc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-medium text-indigo-700">
                    {getInitials(
                      dc.contact.firstName,
                      dc.contact.lastName
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/contacts/${dc.contact.id}`}
                      className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                      {fullName(dc.contact.firstName, dc.contact.lastName)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {dc.contact.jobTitle || dc.contact.email || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dc.isPrimary && (
                    <Badge variant="outline" className="text-xs">
                      Primary
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={roleBadgeColor(dc.role)}
                  >
                    {roleLabel(dc.role)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Contact Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact to Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Contact</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Type to search contacts..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedContactId("");
                  }}
                />
              </div>

              {/* Search results */}
              {searchQuery.length >= 2 && (
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {searching ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No contacts found
                    </div>
                  ) : (
                    searchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                          selectedContactId === c.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedContactId(c.id)}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-700">
                          {getInitials(c.firstName, c.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {fullName(c.firstName, c.lastName)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.email || c.jobTitle || ""}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedContactId || addContactMutation.isPending}
              onClick={() => addContactMutation.mutate()}
            >
              {addContactMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notes Tab
// ---------------------------------------------------------------------------

function NotesTab({ dealId }: { dealId: string }) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");

  const { data: notesData, isLoading } = useQuery({
    queryKey: ["deal", dealId, "notes"],
    queryFn: () => fetchDealNotes(dealId),
  });

  const notes = notesData?.data ?? [];

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", dealId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      setNoteContent("");
      toast.success("Note added");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    addNoteMutation.mutate(noteContent.trim());
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <form onSubmit={handleSubmitNote} className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!noteContent.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </form>

        <Separator />

        {/* Notes list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {fullName(note.author.firstName, note.author.lastName)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activities Tab
// ---------------------------------------------------------------------------

function ActivitiesTab({ dealId }: { dealId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["deal", dealId, "activities"],
    queryFn: () => fetchDealActivities(dealId),
  });

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-amber-100 text-amber-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Calendar className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No activities linked to this deal.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-gray-100 p-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {activityTypeLabel(activity.type)}
                      {activity.dueDate &&
                        ` -- Due ${formatShortDate(activity.dueDate)}`}
                    </p>
                    {activity.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={statusColor(activity.status)}>
                  {activity.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// History Tab
// ---------------------------------------------------------------------------

function HistoryTab({ history }: { history: StageHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <History className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No stage history yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Stage History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-3.5 top-0 h-full w-px bg-border" />

          <div className="space-y-6">
            {history.map((entry, idx) => (
              <div key={entry.id} className="relative flex gap-4 pl-9">
                {/* Timeline dot */}
                <div
                  className={`absolute left-[7px] top-1 h-5 w-5 rounded-full border-2 border-white ${
                    idx === 0 ? "bg-indigo-500" : "bg-gray-300"
                  }`}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {entry.fromStage ? (
                      <>
                        <Badge
                          variant="secondary"
                          className={stageBadgeColor(entry.fromStage)}
                        >
                          {stageLabel(entry.fromStage)}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge
                          variant="secondary"
                          className={stageBadgeColor(entry.toStage)}
                        >
                          {stageLabel(entry.toStage)}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Created at
                        </span>
                        <Badge
                          variant="secondary"
                          className={stageBadgeColor(entry.toStage)}
                        >
                          {stageLabel(entry.toStage)}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.changedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DealDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <Skeleton className="h-9 w-80 mb-4" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
