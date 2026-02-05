"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Building2 } from "lucide-react";
import Link from "next/link";

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
import { companyTypeBadgeColor } from "@/lib/format";
import { QuickAddCompany } from "@/components/forms/quick-add-company";

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
  };
}

interface CompaniesResponse {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const COMPANY_TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
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

async function fetchCompanies(
  search: string,
  type: string
): Promise<CompaniesResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (type && type !== "ALL") params.set("type", type);

  const res = await fetch(`/api/companies?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load companies");
  return res.json();
}

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["companies", search, typeFilter],
    queryFn: () => fetchCompanies(search, typeFilter),
  });

  const companies = data?.data ?? [];

  function handleQuickAddSuccess() {
    setQuickAddOpen(false);
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  }

  if (isLoading) {
    return <CompaniesListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button onClick={() => setQuickAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Company
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
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

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {data?.pagination.total ?? 0} Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No companies found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || typeFilter !== "ALL"
                  ? "Try adjusting your search or filters."
                  : "Get started by adding your first company."}
              </p>
              {!search && typeFilter === "ALL" && (
                <Button
                  className="mt-4"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Open Deals</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={companyTypeBadgeColor(company.type)}
                      >
                        {COMPANY_TYPE_LABELS[company.type] || company.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.industry || "--"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company._count.contacts}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company._count.deals}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.owner.firstName} {company.owner.lastName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuickAddCompany
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}

function CompaniesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
