import { formatDistanceToNow, format, isAfter, subDays } from "date-fns";

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCurrencyFull(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const sevenDaysAgo = subDays(new Date(), 7);

  if (isAfter(d, sevenDaysAgo)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }

  return format(d, "MMM d, yyyy");
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateInput(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function stageBadgeColor(stage: string): string {
  const colors: Record<string, string> = {
    INQUIRY: "bg-slate-100 text-slate-800",
    DISCOVERY_CALL_SCHEDULED: "bg-blue-100 text-blue-800",
    PROPOSAL_NEEDED: "bg-yellow-100 text-yellow-800",
    PROPOSAL_SENT: "bg-amber-100 text-amber-800",
    PROPOSAL_REVIEWED: "bg-orange-100 text-orange-800",
    DECISION_MAKER: "bg-purple-100 text-purple-800",
    NEGOTIATION: "bg-pink-100 text-pink-800",
    CONTRACT: "bg-indigo-100 text-indigo-800",
    CLOSED_WON: "bg-green-100 text-green-800",
    CLOSED_LOST: "bg-red-100 text-red-800",
  };
  return colors[stage] || "bg-gray-100 text-gray-800";
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    INQUIRY: "Inquiry",
    DISCOVERY_CALL_SCHEDULED: "Discovery Call Scheduled",
    PROPOSAL_NEEDED: "Proposal Needed",
    PROPOSAL_SENT: "Proposal Sent",
    PROPOSAL_REVIEWED: "Proposal Reviewed",
    DECISION_MAKER: "With Decision Maker",
    NEGOTIATION: "Negotiation",
    CONTRACT: "Contract",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
  };
  return labels[stage] || stage;
}

export function companyTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    PROSPECT: "bg-blue-100 text-blue-800",
    LEAD: "bg-purple-100 text-purple-800",
    CUSTOMER: "bg-green-100 text-green-800",
    FORMER_CUSTOMER: "bg-gray-100 text-gray-800",
    PARTNER: "bg-amber-100 text-amber-800",
    COMPETITOR: "bg-red-100 text-red-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "text-gray-500",
    MEDIUM: "text-blue-500",
    HIGH: "text-orange-500",
    URGENT: "text-red-500",
  };
  return colors[priority] || "text-gray-500";
}

export function activityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CALL: "Call",
    MEETING: "Meeting",
    EMAIL: "Email",
    TASK: "Task",
    FOLLOW_UP: "Follow Up",
    DEMO: "Demo",
    PRESENTATION: "Presentation",
  };
  return labels[type] || type;
}
