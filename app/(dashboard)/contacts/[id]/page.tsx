"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Smartphone,
  Linkedin,
  Building2,
  Briefcase,
  Send,
} from "lucide-react";

import { updateContactSchema } from "@/lib/validations";
import {
  formatDate,
  formatCurrency,
  stageBadgeColor,
  stageLabel,
  activityTypeLabel,
  fullName,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------- Types ----------

interface Company {
  id: string;
  name: string;
  domain?: string;
  type?: string;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DealContact {
  role: string | null;
  deal: {
    id: string;
    name: string;
    value: string | number;
    stage: string;
    closedStatus: string | null;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  linkedinUrl: string | null;
  status: string;
  isPrimary: boolean;
  leadScore: number | null;
  source: string | null;
  companyId: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company | null;
  owner: Owner | null;
  dealContacts: DealContact[];
}

interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
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
  status: string;
  priority: string;
  completed: boolean;
  createdAt: string;
}

// ---------- Constants ----------

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DO_NOT_CONTACT", label: "Do Not Contact" },
  { value: "CHURNED", label: "Churned" },
] as const;

const SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "COLD_OUTREACH", label: "Cold Outreach" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "INBOUND_CALL", label: "Inbound Call" },
  { value: "PARTNER", label: "Partner" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "CONTENT", label: "Content" },
  { value: "OTHER", label: "Other" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  DECISION_MAKER: "Decision Maker",
  INFLUENCER: "Influencer",
  CHAMPION: "Champion",
  STAKEHOLDER: "Stakeholder",
  BLOCKER: "Blocker",
  END_USER: "End User",
};

function statusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    DO_NOT_CONTACT: "bg-red-100 text-red-800",
    CHURNED: "bg-amber-100 text-amber-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    DO_NOT_CONTACT: "Do Not Contact",
    CHURNED: "Churned",
  };
  return labels[status] || status;
}

// ---------- Main Page ----------

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch contact");
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <ContactDetailSkeleton />;
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-lg font-medium">Contact not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This contact may have been deleted.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/contacts">Back to Contacts</Link>
        </Button>
      </div>
    );
  }

  const contactName = fullName(contact.firstName, contact.lastName);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contactName}</h1>
            <Badge
              variant="secondary"
              className={statusBadgeColor(contact.status)}
            >
              {statusLabel(contact.status)}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            {contact.jobTitle && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {contact.jobTitle}
              </span>
            )}
            {contact.company && (
              <Link
                href={`/companies/${contact.company.id}`}
                className="flex items-center gap-1 hover:underline"
              >
                <Building2 className="h-3.5 w-3.5" />
                {contact.company.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info Bar */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 py-4">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-4 w-4" />
              {contact.phone}
            </a>
          )}
          {contact.mobilePhone && (
            <a
              href={`tel:${contact.mobilePhone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Smartphone className="h-4 w-4" />
              {contact.mobilePhone}
            </a>
          )}
          {contact.linkedinUrl && (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile
            </a>
          )}
          {!contact.email &&
            !contact.phone &&
            !contact.mobilePhone &&
            !contact.linkedinUrl && (
              <span className="text-sm text-muted-foreground">
                No contact information available
              </span>
            )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsTab contact={contact} />
        </TabsContent>

        <TabsContent value="deals">
          <DealsTab dealContacts={contact.dealContacts} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab contactId={id} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesTab contactId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Details Tab ----------

type ContactFormValues = z.infer<typeof updateContactSchema>;

function DetailsTab({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      mobilePhone: contact.mobilePhone || "",
      jobTitle: contact.jobTitle || "",
      department: contact.department || "",
      linkedinUrl: contact.linkedinUrl || "",
      status: contact.status as ContactFormValues["status"],
      isPrimary: contact.isPrimary,
      leadScore: contact.leadScore ?? undefined,
      source: (contact.source as ContactFormValues["source"]) || undefined,
      companyId: contact.companyId || "",
    },
  });

  useEffect(() => {
    setLoadingCompanies(true);
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setCompanies(list);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoadingCompanies(false));
  }, []);

  async function onSubmit(data: ContactFormValues) {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        companyId: data.companyId || undefined,
        email: data.email || undefined,
      };

      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update contact");
      }

      const updated = await res.json();
      queryClient.setQueryData(["contact", contact.id], updated.data);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      reset(data);
      toast.success("Contact updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update contact"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Contact Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>
          </div>

          {/* Mobile & LinkedIn */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mobilePhone">Mobile Phone</Label>
              <Input
                id="mobilePhone"
                placeholder="+1 (555) 000-0000"
                {...register("mobilePhone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/..."
                {...register("linkedinUrl")}
              />
            </div>
          </div>

          {/* Job Title & Department */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="Software Engineer"
                {...register("jobTitle")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Engineering"
                {...register("department")}
              />
            </div>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="companyId">Company</Label>
            <Select
              defaultValue={contact.companyId || undefined}
              onValueChange={(value) => setValue("companyId", value, { shouldDirty: true })}
            >
              <SelectTrigger id="companyId" className="w-full">
                <SelectValue
                  placeholder={
                    loadingCompanies ? "Loading companies..." : "Select company"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={contact.status}
                onValueChange={(value) =>
                  setValue("status", value as ContactFormValues["status"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                defaultValue={contact.source || undefined}
                onValueChange={(value) =>
                  setValue("source", value as ContactFormValues["source"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="source" className="w-full">
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

          {/* Lead Score */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leadScore">Lead Score (0-100)</Label>
              <Input
                id="leadScore"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                {...register("leadScore", { valueAsNumber: true })}
                aria-invalid={!!errors.leadScore}
              />
              {errors.leadScore && (
                <p className="text-sm text-destructive">
                  {errors.leadScore.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={() =>
                reset({
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                  email: contact.email || "",
                  phone: contact.phone || "",
                  mobilePhone: contact.mobilePhone || "",
                  jobTitle: contact.jobTitle || "",
                  department: contact.department || "",
                  linkedinUrl: contact.linkedinUrl || "",
                  status: contact.status as ContactFormValues["status"],
                  isPrimary: contact.isPrimary,
                  leadScore: contact.leadScore ?? undefined,
                  source:
                    (contact.source as ContactFormValues["source"]) ||
                    undefined,
                  companyId: contact.companyId || "",
                })
              }
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Deals Tab ----------

function DealsTab({ dealContacts }: { dealContacts: DealContact[] }) {
  if (dealContacts.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No deals associated with this contact.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Associated Deals</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dealContacts.map((dc) => (
              <TableRow key={dc.deal.id}>
                <TableCell>
                  <Link
                    href={`/deals/${dc.deal.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {dc.deal.name}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(dc.deal.value)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={stageBadgeColor(dc.deal.stage)}
                  >
                    {stageLabel(dc.deal.stage)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dc.role ? ROLE_LABELS[dc.role] || dc.role : "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------- Notes Tab ----------

function NotesTab({ contactId }: { contactId: string }) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery<{ data: Note[] }>({
    queryKey: ["contact-notes", contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}/notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });

  const notes = data?.data ?? [];

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to add note");
      }

      setNewNote("");
      queryClient.invalidateQueries({
        queryKey: ["contact-notes", contactId],
      });
      toast.success("Note added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add note"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Add note form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddNote} className="space-y-3">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newNote.trim()}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No notes yet. Add the first note above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {note.author.firstName} {note.author.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Activities Tab ----------

function ActivitiesTab({ contactId }: { contactId: string }) {
  const { data, isLoading } = useQuery<{ data: Activity[] }>({
    queryKey: ["contact-activities", contactId],
    queryFn: async () => {
      const res = await fetch(`/api/activities?contactId=${contactId}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const activities = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No activities logged for this contact.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {activityTypeLabel(activity.type)}
                  </Badge>
                  {activity.completed && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Completed
                    </Badge>
                  )}
                </div>
                <p className="font-medium">{activity.subject}</p>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                {activity.dueDate && (
                  <p>Due: {formatDate(activity.dueDate)}</p>
                )}
                <p>{formatDate(activity.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------- Loading Skeleton ----------

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Card>
        <CardContent className="flex gap-6 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-32" />
        </CardContent>
      </Card>
      <div>
        <Skeleton className="h-9 w-80" />
        <Card className="mt-4">
          <CardContent className="pt-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
