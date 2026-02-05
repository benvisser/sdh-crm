import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Company
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  industry: z.string().optional(),
  companySize: z
    .enum(["SOLO", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE", "CORPORATION"])
    .optional(),
  annualRevenue: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedinUrl: z.string().optional(),
  type: z
    .enum([
      "PROSPECT",
      "LEAD",
      "CUSTOMER",
      "FORMER_CUSTOMER",
      "PARTNER",
      "COMPETITOR",
    ])
    .optional(),
  source: z
    .enum([
      "WEBSITE",
      "REFERRAL",
      "COLD_OUTREACH",
      "LINKEDIN",
      "CONFERENCE",
      "INBOUND_CALL",
      "PARTNER",
      "ADVERTISING",
      "CONTENT",
      "OTHER",
    ])
    .optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Contact
export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DO_NOT_CONTACT", "CHURNED"]).optional(),
  isPrimary: z.boolean().optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  source: z
    .enum([
      "WEBSITE",
      "REFERRAL",
      "COLD_OUTREACH",
      "LINKEDIN",
      "CONFERENCE",
      "INBOUND_CALL",
      "PARTNER",
      "ADVERTISING",
      "CONTENT",
      "OTHER",
    ])
    .optional(),
  companyId: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Deal
export const createDealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: z.number().min(0, "Value must be positive"),
  currency: z.string().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  stage: z
    .enum([
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
    ])
    .optional(),
  expectedCloseDate: z.string().min(1, "Expected close date is required"),
  source: z
    .enum([
      "WEBSITE",
      "REFERRAL",
      "COLD_OUTREACH",
      "LINKEDIN",
      "CONFERENCE",
      "INBOUND_CALL",
      "PARTNER",
      "ADVERTISING",
      "CONTENT",
      "OTHER",
    ])
    .optional(),
  projectType: z
    .enum([
      "BRANDING",
      "WEB_DESIGN",
      "WEB_DEVELOPMENT",
      "MOBILE_APP",
      "UI_UX",
      "PRINT",
      "MARKETING",
      "VIDEO",
      "PHOTOGRAPHY",
      "OTHER",
    ])
    .optional(),
  estimatedHours: z.number().int().optional(),
  companyId: z.string().min(1, "Company is required"),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStageSchema = z.object({
  stage: z.enum([
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
  ]),
  lostReason: z
    .enum([
      "PRICE",
      "TIMING",
      "COMPETITOR",
      "NO_BUDGET",
      "NO_DECISION",
      "WENT_SILENT",
      "NOT_A_FIT",
      "OTHER",
    ])
    .optional(),
  lostReasonNote: z.string().optional(),
});

// Activity
export const createActivitySchema = z.object({
  type: z.enum([
    "CALL",
    "MEETING",
    "EMAIL",
    "TASK",
    "FOLLOW_UP",
    "DEMO",
    "PRESENTATION",
  ]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  duration: z.number().int().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  completed: z.boolean().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

// Note
export const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  isPinned: z.boolean().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").optional(),
  isPinned: z.boolean().optional(),
});

// Deal Contact
export const addDealContactSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  role: z
    .enum([
      "DECISION_MAKER",
      "INFLUENCER",
      "CHAMPION",
      "STAKEHOLDER",
      "BLOCKER",
      "END_USER",
    ])
    .optional(),
  isPrimary: z.boolean().optional(),
});

// Search
export const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
});
