"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe,
  Users,
  DollarSign,
  FileText,
  Activity,
  ExternalLink,
  Plus,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  companyTypeBadgeColor,
  formatDate,
  formatCurrency,
  stageBadgeColor,
  stageLabel,
  activityTypeLabel,
} from "@/lib/format";
import { QuickAddContact } from "@/components/forms/quick-add-contact";
import { QuickAddDeal } from "@/components/forms/quick-add-deal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  phone: string | null;
  type: string;
  source: string | null;
  owner: CompanyOwner;
  _count: {
    contacts: number;
    deals: number;
    notes: number;
    activities: number;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
}

interface Deal {
  id: string;
  name: string;
  value: string;
  stage: string;
  expectedCloseDate: string | null;
  owner: { firstName: string; lastName: string };
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

interface CompanyFormValues {
  name: string;
  domain: string;
  industry: string;
  companySize: string;
  website: string;
  phone: string;
  type: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPANY_TYPE_OPTIONS = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "LEAD", label: "Lead" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "FORMER_CUSTOMER", label: "Former Customer" },
  { value: "PARTNER", label: "Partner" },
  { value: "COMPETITOR", label: "Competitor" },
] as const;

const COMPANY_TYPE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  LEAD: "Lead",
  CUSTOMER: "Customer",
  FORMER_CUSTOMER: "Former Customer",
  PARTNER: "Partner",
  COMPETITOR: "Competitor",
};

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1001-5000", label: "1001-5000" },
  { value: "5001+", label: "5001+" },
] as const;

const SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "COLD_OUTREACH", label: "Cold Outreach" },
  { value: "INBOUND", label: "Inbound" },
  { value: "EVENT", label: "Event" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "OTHER", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchCompany(id: string): Promise<Company> {
  const res = await fetch(`/api/companies/${id}`);
  if (!res.ok) throw new Error("Failed to load company");
  const json = await res.json();
  return json.data;
}

async function fetchContacts(companyId: string): Promise<Contact[]> {
  const res = await fetch(`/api/companies/${companyId}/contacts`);
  if (!res.ok) throw new Error("Failed to load contacts");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

async function fetchDeals(companyId: string): Promise<Deal[]> {
  const res = await fetch(`/api/companies/${companyId}/deals`);
  if (!res.ok) throw new Error("Failed to load deals");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

async function fetchNotes(companyId: string): Promise<Note[]> {
  const res = await fetch(`/api/companies/${companyId}/notes`);
  if (!res.ok) throw new Error("Failed to load notes");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

async function fetchActivities(companyId: string): Promise<ActivityItem[]> {
  const res = await fetch(`/api/activities?companyId=${companyId}`);
  if (!res.ok) throw new Error("Failed to load activities");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDealOpen, setAddDealOpen] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => fetchCompany(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <CompanyDetailSkeleton />;
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The company you are looking for does not exist or has been removed.
        </p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/companies"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Companies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge
              variant="secondary"
              className={companyTypeBadgeColor(company.type)}
            >
              {COMPANY_TYPE_LABELS[company.type] || company.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {company.industry && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {company.industry}
              </span>
            )}
            {company.website && (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" />
                {company.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-50 p-2">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-xl font-bold">{company._count.contacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-50 p-2">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Deals</p>
                <p className="text-xl font-bold">{company._count.deals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-indigo-50 p-2">
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Deal Value
                </p>
                <DealValueStat companyId={id} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <DetailsTab company={company} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <ContactsTab
            companyId={id}
            addContactOpen={addContactOpen}
            setAddContactOpen={setAddContactOpen}
          />
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          <DealsTab
            companyId={id}
            addDealOpen={addDealOpen}
            setAddDealOpen={setAddDealOpen}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesTab companyId={id} />
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <ActivitiesTab companyId={id} />
        </TabsContent>
      </Tabs>

      {/* Quick-add Dialogs */}
      <QuickAddContact
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        defaultCompanyId={id}
        onSuccess={() => {
          setAddContactOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["company-contacts", id],
          });
          queryClient.invalidateQueries({ queryKey: ["company", id] });
        }}
      />
      <QuickAddDeal
        open={addDealOpen}
        onOpenChange={setAddDealOpen}
        defaultCompanyId={id}
        onSuccess={() => {
          setAddDealOpen(false);
          queryClient.invalidateQueries({ queryKey: ["company-deals", id] });
          queryClient.invalidateQueries({ queryKey: ["company", id] });
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deal Value Stat (fetches deals to compute total value)
// ---------------------------------------------------------------------------

function DealValueStat({ companyId }: { companyId: string }) {
  const { data: deals } = useQuery({
    queryKey: ["company-deals", companyId],
    queryFn: () => fetchDeals(companyId),
  });

  const totalValue =
    deals?.reduce((sum, deal) => sum + parseFloat(deal.value || "0"), 0) ?? 0;

  return <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>;
}

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------

function DetailsTab({ company }: { company: Company }) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } =
    useForm<CompanyFormValues>({
      defaultValues: {
        name: company.name || "",
        domain: company.domain || "",
        industry: company.industry || "",
        companySize: company.companySize || "",
        website: company.website || "",
        phone: company.phone || "",
        type: company.type || "PROSPECT",
        source: company.source || "",
      },
    });

  const currentType = watch("type");
  const currentSize = watch("companySize");
  const currentSource = watch("source");

  async function onSubmit(data: CompanyFormValues) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update company");
      }

      toast.success("Company updated successfully");
      queryClient.invalidateQueries({ queryKey: ["company", company.id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update company"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="detail-name">Company Name</Label>
              <Input id="detail-name" {...register("name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-domain">Domain</Label>
              <Input
                id="detail-domain"
                placeholder="example.com"
                {...register("domain")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-industry">Industry</Label>
              <Input
                id="detail-industry"
                placeholder="Technology"
                {...register("industry")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-size">Company Size</Label>
              <Select
                value={currentSize}
                onValueChange={(value) => setValue("companySize", value)}
              >
                <SelectTrigger id="detail-size" className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-website">Website</Label>
              <Input
                id="detail-website"
                placeholder="https://example.com"
                {...register("website")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-phone">Phone</Label>
              <Input
                id="detail-phone"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-type">Type</Label>
              <Select
                value={currentType}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger id="detail-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-source">Source</Label>
              <Select
                value={currentSource}
                onValueChange={(value) => setValue("source", value)}
              >
                <SelectTrigger id="detail-source" className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Contacts Tab
// ---------------------------------------------------------------------------

function ContactsTab({
  companyId,
  addContactOpen,
  setAddContactOpen,
}: {
  companyId: string;
  addContactOpen: boolean;
  setAddContactOpen: (open: boolean) => void;
}) {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["company-contacts", companyId],
    queryFn: () => fetchContacts(companyId),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Contacts</CardTitle>
        <Button size="sm" onClick={() => setAddContactOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No contacts yet. Add the first contact for this company.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Job Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email || "--"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.phone || "--"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.jobTitle || "--"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Deals Tab
// ---------------------------------------------------------------------------

function DealsTab({
  companyId,
  addDealOpen,
  setAddDealOpen,
}: {
  companyId: string;
  addDealOpen: boolean;
  setAddDealOpen: (open: boolean) => void;
}) {
  const { data: deals, isLoading } = useQuery({
    queryKey: ["company-deals", companyId],
    queryFn: () => fetchDeals(companyId),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Deals</CardTitle>
        <Button size="sm" onClick={() => setAddDealOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !deals || deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No deals yet. Add the first deal for this company.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {deal.name}
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
                    {deal.expectedCloseDate
                      ? formatDate(deal.expectedCloseDate)
                      : "--"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.owner.firstName} {deal.owner.lastName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notes Tab
// ---------------------------------------------------------------------------

function NotesTab({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["company-notes", companyId],
    queryFn: () => fetchNotes(companyId),
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/companies/${companyId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Note added");
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["company-notes", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleAddNote() {
    const trimmed = noteContent.trim();
    if (!trimmed) return;
    addNote.mutate(trimmed);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Write a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={addNote.isPending || !noteContent.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {addNote.isPending ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !notes || notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Write the first note for this company.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">
                    {note.author.firstName} {note.author.lastName}
                  </span>
                  <span>&middot;</span>
                  <span>{formatDate(note.createdAt)}</span>
                </div>
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

function ActivitiesTab({ companyId }: { companyId: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["company-activities", companyId],
    queryFn: () => fetchActivities(companyId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No activities recorded for this company.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="mt-0.5 rounded-md bg-gray-100 p-1.5">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{activity.subject}</p>
                    <Badge variant="secondary" className="text-xs">
                      {activityTypeLabel(activity.type)}
                    </Badge>
                    {activity.completed && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 text-xs"
                      >
                        Completed
                      </Badge>
                    )}
                  </div>
                  {activity.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {activity.user.firstName} {activity.user.lastName}
                    </span>
                    {activity.dueDate && (
                      <>
                        <span>&middot;</span>
                        <span>Due {formatDate(activity.dueDate)}</span>
                      </>
                    )}
                    <span>&middot;</span>
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
