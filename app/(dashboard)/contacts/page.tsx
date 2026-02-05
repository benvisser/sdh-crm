"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Plus, Users, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { QuickAddContact } from "@/components/forms/quick-add-contact";
import { formatDate } from "@/lib/format";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string | null;
  phone: string | null;
  status: string;
  lastContactedAt: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ContactsResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DO_NOT_CONTACT", label: "Do Not Contact" },
  { value: "CHURNED", label: "Churned" },
] as const;

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

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter && statusFilter !== "ALL")
    queryParams.set("status", statusFilter);

  const { data, isLoading } = useQuery<ContactsResponse>({
    queryKey: ["contacts", search, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const contacts = data?.data ?? [];

  function handleQuickAddSuccess() {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    toast.success("Contact created successfully");
  }

  if (isLoading) {
    return <ContactsListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total ?? 0} total contacts
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No contacts found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first contact."}
              </p>
              {!search && statusFilter === "ALL" && (
                <Button
                  className="mt-4"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Contacted</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <Badge
                          variant="secondary"
                          className={statusBadgeColor(contact.status)}
                        >
                          {statusLabel(contact.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.jobTitle || "--"}
                    </TableCell>
                    <TableCell>
                      {contact.company ? (
                        <Link
                          href={`/companies/${contact.company.id}`}
                          className="text-muted-foreground hover:underline"
                        >
                          {contact.company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.lastContactedAt
                        ? formatDate(contact.lastContactedAt)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.owner
                        ? `${contact.owner.firstName} ${contact.owner.lastName}`
                        : "--"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Dialog */}
      <QuickAddContact
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}

function ContactsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
