import { NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// CSV Parser - handles HubSpot's quoted CSV format
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (values[index] || "").replace(/^"|"$/g, "").trim();
      });
      records.push(record);
    }
  }

  return records;
}

// Data mapping helpers
function parseHubSpotDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function mapLifecycleStageToCompanyType(stage: string): string {
  const mapping: Record<string, string> = {
    Lead: "LEAD",
    "Marketing Qualified Lead": "LEAD",
    "Sales Qualified Lead": "PROSPECT",
    Opportunity: "PROSPECT",
    Customer: "CUSTOMER",
    Evangelist: "CUSTOMER",
    Other: "PROSPECT",
  };
  return mapping[stage] || "PROSPECT";
}

function mapDealStage(hubspotStage: string): string {
  const mapping: Record<string, string> = {
    "Website Form Submission": "QUALIFIED",
    "Discovery Call Scheduled": "QUALIFIED",
    "Proposal Needed": "DISCOVERY",
    "Proposal Sent": "PROPOSAL",
    "Contract Sent": "NEGOTIATION",
    "Closed Won": "CLOSED_WON",
    "Closed Lost": "CLOSED_LOST",
  };
  return mapping[hubspotStage] || "QUALIFIED";
}

function parseBudget(budgetStr: string): number {
  if (!budgetStr || budgetStr.trim() === "") return 0;

  const cleaned = budgetStr.replace(/[$,]/g, "").trim();

  if (cleaned.includes("<")) {
    const match = cleaned.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    if (parts.length === 2) {
      const min = parseInt(parts[0].trim().replace(/\D/g, ""));
      const max = parseInt(parts[1].trim().replace(/\D/g, ""));
      return isNaN(min) || isNaN(max) ? 0 : (min + max) / 2;
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function mapCompanySize(employeeCount: string): string | null {
  if (!employeeCount) return null;
  const count = parseInt(employeeCount);
  if (isNaN(count)) return null;

  if (count === 1) return "SOLO";
  if (count <= 10) return "SMALL";
  if (count <= 50) return "MEDIUM";
  if (count <= 200) return "LARGE";
  if (count <= 1000) return "ENTERPRISE";
  return "CORPORATION";
}

// Ensure default user exists
async function ensureDefaultUser() {
  const DEFAULT_USER_EMAIL = "jordan@agency.com";

  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });

  if (!user) {
    const passwordHash = bcrypt.hashSync("password123", 10);
    user = await prisma.user.create({
      data: {
        email: DEFAULT_USER_EMAIL,
        passwordHash,
        firstName: "Jordan",
        lastName: "Rivera",
        role: "ADMIN",
        isActive: true,
      },
    });
  }

  return user;
}

// Clear existing data but preserve users
async function clearSeedData() {
  await prisma.dealStageHistory.deleteMany();
  await prisma.dealContact.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.dealTag.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
}

// Import companies from CSV
async function importCompanies(
  csvContent: string,
  defaultUserId: string
): Promise<{ imported: number; companyMap: Map<string, string> }> {
  const records = parseCSV(csvContent);
  const hubspotIdToInternalId = new Map<string, string>();
  let imported = 0;

  for (const record of records) {
    try {
      if (!record["Company name"]?.trim()) continue;

      const company = await prisma.company.create({
        data: {
          name: record["Company name"].trim(),
          domain: record["Company Domain Name"]?.trim() || null,
          website: record["Website URL"]?.trim() || null,
          phone: record["Phone Number"]?.trim() || null,
          city: record["City"]?.trim() || null,
          state: record["State/Region"]?.trim() || null,
          postalCode: record["Postal Code"]?.trim() || null,
          country: record["Country/Region"]?.trim() || null,
          industry: record["Industry"]?.trim() || null,
          companySize: mapCompanySize(record["Number of Employees"]) as
            | "SOLO"
            | "SMALL"
            | "MEDIUM"
            | "LARGE"
            | "ENTERPRISE"
            | "CORPORATION"
            | null,
          annualRevenue: record["Annual Revenue"]
            ? parseBudget(record["Annual Revenue"])
            : null,
          type: mapLifecycleStageToCompanyType(
            record["Lifecycle Stage"] || ""
          ) as
            | "PROSPECT"
            | "LEAD"
            | "CUSTOMER"
            | "FORMER_CUSTOMER"
            | "PARTNER"
            | "COMPETITOR",
          source: "OTHER",
          ownerId: defaultUserId,
          createdAt: parseHubSpotDate(record["Create Date"]) || new Date(),
        },
      });

      hubspotIdToInternalId.set(record["Record ID"], company.id);
      imported++;
    } catch (error) {
      console.warn(
        `Failed to import company "${record["Company name"]}":`,
        error
      );
    }
  }

  return { imported, companyMap: hubspotIdToInternalId };
}

// Import contacts from CSV
async function importContacts(
  csvContent: string,
  defaultUserId: string,
  companyMap: Map<string, string>
): Promise<number> {
  const records = parseCSV(csvContent);
  let imported = 0;

  for (const record of records) {
    try {
      if (!record["First Name"]?.trim() && !record["Last Name"]?.trim())
        continue;

      let companyId: string | null = null;

      // Try to find company by HubSpot company ID
      if (record["Associated Company IDs"]) {
        const hubspotCompanyIds =
          record["Associated Company IDs"].split(";");
        for (const hubspotCompanyId of hubspotCompanyIds) {
          const mappedCompanyId = companyMap.get(hubspotCompanyId.trim());
          if (mappedCompanyId) {
            companyId = mappedCompanyId;
            break;
          }
        }
      }

      // Fallback: find by company name
      if (!companyId && record["Company Name"]?.trim()) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            name: {
              equals: record["Company Name"].trim(),
              mode: "insensitive",
            },
          },
        });
        if (existingCompany) {
          companyId = existingCompany.id;
        }
      }

      await prisma.contact.create({
        data: {
          firstName: record["First Name"]?.trim() || "",
          lastName: record["Last Name"]?.trim() || "",
          email: record["Email"]?.trim() || null,
          phone: record["Phone Number"]?.trim() || null,
          mobilePhone: record["Mobile Phone Number"]?.trim() || null,
          jobTitle: record["Job Title"]?.trim() || null,
          linkedinUrl: record["LinkedIn URL"]?.trim() || null,
          companyId,
          status: "ACTIVE",
          source: "OTHER",
          ownerId: defaultUserId,
          createdAt: parseHubSpotDate(record["Create Date"]) || new Date(),
        },
      });

      imported++;
    } catch (error) {
      console.warn(
        `Failed to import contact "${record["First Name"]} ${record["Last Name"]}":`,
        error
      );
    }
  }

  return imported;
}

// Import deals from CSV
async function importDeals(
  csvContent: string,
  defaultUserId: string
): Promise<number> {
  const records = parseCSV(csvContent);
  let imported = 0;

  // Get first company as fallback for deals without a specific company
  let defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: "Unknown Company",
        type: "PROSPECT",
        ownerId: defaultUserId,
      },
    });
  }

  for (const record of records) {
    try {
      if (!record["Deal Name"]?.trim()) continue;

      const amount = record["Amount"] ? parseBudget(record["Amount"]) : 1000;
      const closeDate =
        parseHubSpotDate(record["Close Date"]) ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.deal.create({
        data: {
          name: record["Deal Name"].trim(),
          value: amount,
          stage: mapDealStage(record["Deal Stage"] || "") as
            | "QUALIFIED"
            | "DISCOVERY"
            | "PROPOSAL"
            | "NEGOTIATION"
            | "CLOSED_WON"
            | "CLOSED_LOST",
          expectedCloseDate: closeDate,
          companyId: defaultCompany.id,
          ownerId: defaultUserId,
          createdAt: new Date(),
        },
      });

      imported++;
    } catch (error) {
      console.warn(
        `Failed to import deal "${record["Deal Name"]}":`,
        error
      );
    }
  }

  return imported;
}

export async function POST(request: Request) {
  try {
    await requireAuthFromRequest(request);

    const formData = await request.formData();

    const companiesFile = formData.get("companies") as File | null;
    const contactsFile = formData.get("contacts") as File | null;
    const dealsFile = formData.get("deals") as File | null;

    if (!companiesFile && !contactsFile && !dealsFile) {
      return NextResponse.json(
        { error: "At least one CSV file is required" },
        { status: 400 }
      );
    }

    let totalImported = 0;
    const results: Record<string, number> = {};

    const defaultUser = await ensureDefaultUser();

    // Clear existing seed data (preserves users)
    await clearSeedData();

    // Import companies first (contacts and deals depend on them)
    let companyMap = new Map<string, string>();
    if (companiesFile) {
      const companiesContent = await companiesFile.text();
      const companyResults = await importCompanies(
        companiesContent,
        defaultUser.id
      );
      results.companies = companyResults.imported;
      companyMap = companyResults.companyMap;
      totalImported += companyResults.imported;
    }

    // Import contacts
    if (contactsFile) {
      const contactsContent = await contactsFile.text();
      const contactsImported = await importContacts(
        contactsContent,
        defaultUser.id,
        companyMap
      );
      results.contacts = contactsImported;
      totalImported += contactsImported;
    }

    // Import deals
    if (dealsFile) {
      const dealsContent = await dealsFile.text();
      const dealsImported = await importDeals(dealsContent, defaultUser.id);
      results.deals = dealsImported;
      totalImported += dealsImported;
    }

    return NextResponse.json({
      success: true,
      imported: totalImported,
      details: results,
      message: "HubSpot import completed successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
