import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: relative dates
// ---------------------------------------------------------------------------
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function main() {
  console.log("Seeding database...\n");

  // =========================================================================
  // 0. Clean existing data (order matters because of FK constraints)
  // =========================================================================
  console.log("Clearing existing data...");
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
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // =========================================================================
  // 1. Users
  // =========================================================================
  console.log("Creating users...");
  const passwordHash = bcrypt.hashSync("password123", 10);

  const jordan = await prisma.user.create({
    data: {
      email: "jordan@agency.com",
      passwordHash,
      firstName: "Jordan",
      lastName: "Rivera",
      role: "ADMIN",
      isActive: true,
      lastLoginAt: daysAgo(0),
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: "alex@agency.com",
      passwordHash,
      firstName: "Alex",
      lastName: "Chen",
      role: "SALES_REP",
      isActive: true,
      lastLoginAt: daysAgo(1),
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: "sam@agency.com",
      passwordHash,
      firstName: "Sam",
      lastName: "Patel",
      role: "SALES_REP",
      isActive: true,
      lastLoginAt: daysAgo(2),
    },
  });

  console.log(`  Created users: ${jordan.firstName}, ${alex.firstName}, ${sam.firstName}`);

  // =========================================================================
  // 2. Tags
  // =========================================================================
  console.log("Creating tags...");
  const tagsData = [
    { name: "Hot Lead", color: "#EF4444" },
    { name: "Enterprise", color: "#7C3AED" },
    { name: "Referral", color: "#10B981" },
    { name: "At Risk", color: "#F59E0B" },
    { name: "Quick Win", color: "#3B82F6" },
    { name: "Repeat Client", color: "#06B6D4" },
    { name: "Design Sprint", color: "#EC4899" },
    { name: "Long-term", color: "#8B5CF6" },
  ];

  const tags: Record<string, Awaited<ReturnType<typeof prisma.tag.create>>> = {};
  for (const t of tagsData) {
    tags[t.name] = await prisma.tag.create({ data: t });
  }
  console.log(`  Created ${Object.keys(tags).length} tags`);

  // =========================================================================
  // 3. Companies
  // =========================================================================
  console.log("Creating companies...");
  const companiesData = [
    {
      name: "Meridian Health Group",
      domain: "meridianhealth.com",
      industry: "Healthcare",
      companySize: "LARGE" as const,
      annualRevenue: 85000000,
      address: "400 Wellness Blvd",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "US",
      phone: "(512) 555-0140",
      website: "https://meridianhealth.com",
      type: "CUSTOMER" as const,
      source: "REFERRAL" as const,
      ownerId: alex.id,
    },
    {
      name: "Vertex SaaS",
      domain: "vertexsaas.io",
      industry: "Technology",
      companySize: "MEDIUM" as const,
      annualRevenue: 12000000,
      address: "2200 Cloud Ave, Ste 300",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
      phone: "(415) 555-0198",
      website: "https://vertexsaas.io",
      type: "CUSTOMER" as const,
      source: "WEBSITE" as const,
      ownerId: alex.id,
    },
    {
      name: "Bloom & Branch Co",
      domain: "bloomandbranch.com",
      industry: "Retail / E-commerce",
      companySize: "SMALL" as const,
      annualRevenue: 3200000,
      address: "88 Garden Row",
      city: "Portland",
      state: "OR",
      postalCode: "97201",
      country: "US",
      phone: "(503) 555-0127",
      website: "https://bloomandbranch.com",
      type: "LEAD" as const,
      source: "LINKEDIN" as const,
      ownerId: sam.id,
    },
    {
      name: "Catalyst Ventures",
      domain: "catalystvc.com",
      industry: "Venture Capital",
      companySize: "SMALL" as const,
      annualRevenue: 950000,
      address: "1 Market St, Fl 40",
      city: "San Francisco",
      state: "CA",
      postalCode: "94111",
      country: "US",
      phone: "(415) 555-0233",
      website: "https://catalystvc.com",
      type: "PROSPECT" as const,
      source: "CONFERENCE" as const,
      ownerId: jordan.id,
    },
    {
      name: "NovaTech Industries",
      domain: "novatech-ind.com",
      industry: "Manufacturing",
      companySize: "ENTERPRISE" as const,
      annualRevenue: 250000000,
      address: "7500 Industrial Pkwy",
      city: "Detroit",
      state: "MI",
      postalCode: "48201",
      country: "US",
      phone: "(313) 555-0175",
      website: "https://novatech-ind.com",
      type: "LEAD" as const,
      source: "COLD_OUTREACH" as const,
      ownerId: sam.id,
    },
    {
      name: "Pinnacle Financial",
      domain: "pinnaclefin.com",
      industry: "Financial Services",
      companySize: "LARGE" as const,
      annualRevenue: 120000000,
      address: "200 Wall St",
      city: "New York",
      state: "NY",
      postalCode: "10005",
      country: "US",
      phone: "(212) 555-0188",
      website: "https://pinnaclefin.com",
      type: "CUSTOMER" as const,
      source: "REFERRAL" as const,
      ownerId: alex.id,
    },
    {
      name: "Greenleaf Organics",
      domain: "greenleaforganics.com",
      industry: "Food & Beverage",
      companySize: "MEDIUM" as const,
      annualRevenue: 8500000,
      address: "320 Harvest Ln",
      city: "Boulder",
      state: "CO",
      postalCode: "80301",
      country: "US",
      phone: "(720) 555-0144",
      website: "https://greenleaforganics.com",
      type: "PROSPECT" as const,
      source: "CONTENT" as const,
      ownerId: sam.id,
    },
    {
      name: "Atlas Real Estate",
      domain: "atlasre.com",
      industry: "Real Estate",
      companySize: "MEDIUM" as const,
      annualRevenue: 22000000,
      address: "5000 Skyline Dr",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
      country: "US",
      phone: "(303) 555-0162",
      website: "https://atlasre.com",
      type: "LEAD" as const,
      source: "WEBSITE" as const,
      ownerId: jordan.id,
    },
    {
      name: "Drift Coffee Co",
      domain: "driftcoffee.com",
      industry: "Food & Beverage",
      companySize: "SMALL" as const,
      annualRevenue: 1800000,
      address: "15 Roast Ave",
      city: "Seattle",
      state: "WA",
      postalCode: "98101",
      country: "US",
      phone: "(206) 555-0137",
      website: "https://driftcoffee.com",
      type: "PROSPECT" as const,
      source: "LINKEDIN" as const,
      ownerId: sam.id,
    },
    {
      name: "Ironclad Security",
      domain: "ironcladsec.com",
      industry: "Cybersecurity",
      companySize: "MEDIUM" as const,
      annualRevenue: 18000000,
      address: "900 Cipher Rd",
      city: "Reston",
      state: "VA",
      postalCode: "20190",
      country: "US",
      phone: "(571) 555-0199",
      website: "https://ironcladsec.com",
      type: "LEAD" as const,
      source: "PARTNER" as const,
      ownerId: alex.id,
    },
  ];

  const companies: Record<string, Awaited<ReturnType<typeof prisma.company.create>>> = {};
  for (const c of companiesData) {
    companies[c.name] = await prisma.company.create({ data: c });
  }
  console.log(`  Created ${Object.keys(companies).length} companies`);

  // Company-tag associations
  await prisma.companyTag.createMany({
    data: [
      { companyId: companies["Meridian Health Group"].id, tagId: tags["Enterprise"].id },
      { companyId: companies["Meridian Health Group"].id, tagId: tags["Repeat Client"].id },
      { companyId: companies["Vertex SaaS"].id, tagId: tags["Repeat Client"].id },
      { companyId: companies["Bloom & Branch Co"].id, tagId: tags["Hot Lead"].id },
      { companyId: companies["Catalyst Ventures"].id, tagId: tags["Quick Win"].id },
      { companyId: companies["NovaTech Industries"].id, tagId: tags["Enterprise"].id },
      { companyId: companies["NovaTech Industries"].id, tagId: tags["Long-term"].id },
      { companyId: companies["Pinnacle Financial"].id, tagId: tags["Enterprise"].id },
      { companyId: companies["Pinnacle Financial"].id, tagId: tags["Repeat Client"].id },
      { companyId: companies["Greenleaf Organics"].id, tagId: tags["Referral"].id },
      { companyId: companies["Atlas Real Estate"].id, tagId: tags["Hot Lead"].id },
      { companyId: companies["Drift Coffee Co"].id, tagId: tags["Quick Win"].id },
      { companyId: companies["Ironclad Security"].id, tagId: tags["At Risk"].id },
    ],
  });

  // =========================================================================
  // 4. Contacts
  // =========================================================================
  console.log("Creating contacts...");
  const contactsData = [
    // Meridian Health Group
    {
      firstName: "Diana",
      lastName: "Morales",
      jobTitle: "CEO",
      department: "Executive",
      email: "diana.morales@meridianhealth.com",
      phone: "(512) 555-0141",
      isPrimary: true,
      leadScore: 92,
      source: "REFERRAL" as const,
      companyId: companies["Meridian Health Group"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(3),
    },
    {
      firstName: "Tom",
      lastName: "Nguyen",
      jobTitle: "Marketing Director",
      department: "Marketing",
      email: "tom.nguyen@meridianhealth.com",
      phone: "(512) 555-0142",
      isPrimary: false,
      leadScore: 78,
      source: "REFERRAL" as const,
      companyId: companies["Meridian Health Group"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(5),
    },
    // Vertex SaaS
    {
      firstName: "Priya",
      lastName: "Sharma",
      jobTitle: "Head of Product",
      department: "Product",
      email: "priya@vertexsaas.io",
      phone: "(415) 555-0199",
      isPrimary: true,
      leadScore: 85,
      source: "WEBSITE" as const,
      companyId: companies["Vertex SaaS"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(1),
    },
    {
      firstName: "Marcus",
      lastName: "Lee",
      jobTitle: "CTO",
      department: "Engineering",
      email: "marcus.lee@vertexsaas.io",
      phone: "(415) 555-0200",
      isPrimary: false,
      leadScore: 70,
      source: "WEBSITE" as const,
      companyId: companies["Vertex SaaS"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(10),
    },
    // Bloom & Branch Co
    {
      firstName: "Olivia",
      lastName: "Hart",
      jobTitle: "Founder & CEO",
      department: "Executive",
      email: "olivia@bloomandbranch.com",
      phone: "(503) 555-0128",
      isPrimary: true,
      leadScore: 88,
      source: "LINKEDIN" as const,
      companyId: companies["Bloom & Branch Co"].id,
      ownerId: sam.id,
      lastContactedAt: daysAgo(2),
    },
    // Catalyst Ventures
    {
      firstName: "Ryan",
      lastName: "Foster",
      jobTitle: "Managing Partner",
      department: "Executive",
      email: "ryan.foster@catalystvc.com",
      phone: "(415) 555-0234",
      isPrimary: true,
      leadScore: 60,
      source: "CONFERENCE" as const,
      companyId: companies["Catalyst Ventures"].id,
      ownerId: jordan.id,
      lastContactedAt: daysAgo(14),
    },
    {
      firstName: "Elena",
      lastName: "Vasquez",
      jobTitle: "VP of Marketing",
      department: "Marketing",
      email: "elena.v@catalystvc.com",
      phone: "(415) 555-0235",
      isPrimary: false,
      leadScore: 55,
      source: "CONFERENCE" as const,
      companyId: companies["Catalyst Ventures"].id,
      ownerId: jordan.id,
      lastContactedAt: daysAgo(20),
    },
    // NovaTech Industries
    {
      firstName: "James",
      lastName: "Whitfield",
      jobTitle: "VP of Digital Transformation",
      department: "Technology",
      email: "j.whitfield@novatech-ind.com",
      phone: "(313) 555-0176",
      isPrimary: true,
      leadScore: 72,
      source: "COLD_OUTREACH" as const,
      companyId: companies["NovaTech Industries"].id,
      ownerId: sam.id,
      lastContactedAt: daysAgo(7),
    },
    {
      firstName: "Linda",
      lastName: "Park",
      jobTitle: "Procurement Manager",
      department: "Operations",
      email: "linda.park@novatech-ind.com",
      phone: "(313) 555-0177",
      isPrimary: false,
      leadScore: 45,
      source: "COLD_OUTREACH" as const,
      companyId: companies["NovaTech Industries"].id,
      ownerId: sam.id,
      lastContactedAt: daysAgo(12),
    },
    // Pinnacle Financial
    {
      firstName: "Catherine",
      lastName: "Blair",
      jobTitle: "Chief Marketing Officer",
      department: "Marketing",
      email: "c.blair@pinnaclefin.com",
      phone: "(212) 555-0189",
      isPrimary: true,
      leadScore: 90,
      source: "REFERRAL" as const,
      companyId: companies["Pinnacle Financial"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(4),
    },
    // Greenleaf Organics
    {
      firstName: "Derek",
      lastName: "Stone",
      jobTitle: "Marketing Manager",
      department: "Marketing",
      email: "derek@greenleaforganics.com",
      phone: "(720) 555-0145",
      isPrimary: true,
      leadScore: 50,
      source: "CONTENT" as const,
      companyId: companies["Greenleaf Organics"].id,
      ownerId: sam.id,
      lastContactedAt: daysAgo(18),
    },
    // Atlas Real Estate
    {
      firstName: "Rachel",
      lastName: "Kim",
      jobTitle: "Director of Operations",
      department: "Operations",
      email: "rachel.kim@atlasre.com",
      phone: "(303) 555-0163",
      isPrimary: true,
      leadScore: 75,
      source: "WEBSITE" as const,
      companyId: companies["Atlas Real Estate"].id,
      ownerId: jordan.id,
      lastContactedAt: daysAgo(6),
    },
    {
      firstName: "Ben",
      lastName: "Wallace",
      jobTitle: "CEO",
      department: "Executive",
      email: "ben.wallace@atlasre.com",
      phone: "(303) 555-0164",
      isPrimary: false,
      leadScore: 82,
      source: "WEBSITE" as const,
      companyId: companies["Atlas Real Estate"].id,
      ownerId: jordan.id,
      lastContactedAt: daysAgo(9),
    },
    // Drift Coffee Co
    {
      firstName: "Mia",
      lastName: "Torres",
      jobTitle: "Founder",
      department: "Executive",
      email: "mia@driftcoffee.com",
      phone: "(206) 555-0138",
      isPrimary: true,
      leadScore: 65,
      source: "LINKEDIN" as const,
      companyId: companies["Drift Coffee Co"].id,
      ownerId: sam.id,
      lastContactedAt: daysAgo(11),
    },
    // Ironclad Security
    {
      firstName: "Kevin",
      lastName: "Zhao",
      jobTitle: "VP of Marketing",
      department: "Marketing",
      email: "k.zhao@ironcladsec.com",
      phone: "(571) 555-0200",
      isPrimary: true,
      leadScore: 68,
      source: "PARTNER" as const,
      companyId: companies["Ironclad Security"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(8),
    },
    {
      firstName: "Sarah",
      lastName: "Mitchell",
      jobTitle: "CTO",
      department: "Engineering",
      email: "s.mitchell@ironcladsec.com",
      phone: "(571) 555-0201",
      isPrimary: false,
      leadScore: 58,
      source: "PARTNER" as const,
      companyId: companies["Ironclad Security"].id,
      ownerId: alex.id,
      lastContactedAt: daysAgo(15),
    },
    // Additional contact without company (freelance lead)
    {
      firstName: "Leo",
      lastName: "Grant",
      jobTitle: "Independent Consultant",
      department: null,
      email: "leo.grant@gmail.com",
      phone: "(310) 555-0122",
      isPrimary: false,
      leadScore: 40,
      source: "LINKEDIN" as const,
      companyId: null,
      ownerId: jordan.id,
      lastContactedAt: daysAgo(30),
    },
  ];

  const contacts: Record<string, Awaited<ReturnType<typeof prisma.contact.create>>> = {};
  for (const c of contactsData) {
    const key = `${c.firstName} ${c.lastName}`;
    contacts[key] = await prisma.contact.create({ data: c });
  }
  console.log(`  Created ${Object.keys(contacts).length} contacts`);

  // Contact-tag associations
  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts["Diana Morales"].id, tagId: tags["Enterprise"].id },
      { contactId: contacts["Olivia Hart"].id, tagId: tags["Hot Lead"].id },
      { contactId: contacts["Catherine Blair"].id, tagId: tags["Repeat Client"].id },
      { contactId: contacts["Ryan Foster"].id, tagId: tags["Referral"].id },
      { contactId: contacts["James Whitfield"].id, tagId: tags["Enterprise"].id },
      { contactId: contacts["Mia Torres"].id, tagId: tags["Quick Win"].id },
    ],
  });

  // =========================================================================
  // 5. Deals
  // =========================================================================
  console.log("Creating deals...");

  const deal1 = await prisma.deal.create({
    data: {
      name: "Meridian Health - Brand Identity",
      value: 75000,
      probability: 100,
      weightedValue: 75000,
      stage: "CLOSED_WON",
      pipelinePosition: 0,
      expectedCloseDate: daysAgo(30),
      actualCloseDate: daysAgo(28),
      closedStatus: "WON",
      source: "REFERRAL",
      projectType: "BRANDING",
      estimatedHours: 320,
      companyId: companies["Meridian Health Group"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(28),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      name: "Vertex SaaS - Product Dashboard UI",
      value: 95000,
      probability: 80,
      weightedValue: 76000,
      stage: "CONTRACT",
      pipelinePosition: 7,
      expectedCloseDate: daysFromNow(14),
      source: "WEBSITE",
      projectType: "UI_UX",
      estimatedHours: 400,
      companyId: companies["Vertex SaaS"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(5),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      name: "Bloom & Branch - E-commerce Redesign",
      value: 45000,
      probability: 60,
      weightedValue: 27000,
      stage: "PROPOSAL_SENT",
      pipelinePosition: 3,
      expectedCloseDate: daysFromNow(30),
      source: "LINKEDIN",
      projectType: "WEB_DESIGN",
      estimatedHours: 200,
      companyId: companies["Bloom & Branch Co"].id,
      ownerId: sam.id,
      stageChangedAt: daysAgo(3),
    },
  });

  const deal4 = await prisma.deal.create({
    data: {
      name: "Catalyst Ventures - Pitch Deck Design",
      value: 8500,
      probability: 40,
      weightedValue: 3400,
      stage: "DISCOVERY_CALL_SCHEDULED",
      pipelinePosition: 1,
      expectedCloseDate: daysFromNow(45),
      source: "CONFERENCE",
      projectType: "MARKETING",
      estimatedHours: 40,
      companyId: companies["Catalyst Ventures"].id,
      ownerId: jordan.id,
      stageChangedAt: daysAgo(7),
    },
  });

  const deal5 = await prisma.deal.create({
    data: {
      name: "NovaTech - Corporate Website Overhaul",
      value: 150000,
      probability: 30,
      weightedValue: 45000,
      stage: "INQUIRY",
      pipelinePosition: 0,
      expectedCloseDate: daysFromNow(90),
      source: "COLD_OUTREACH",
      projectType: "WEB_DEVELOPMENT",
      estimatedHours: 650,
      companyId: companies["NovaTech Industries"].id,
      ownerId: sam.id,
      stageChangedAt: daysAgo(10),
    },
  });

  const deal6 = await prisma.deal.create({
    data: {
      name: "Pinnacle Financial - Annual Report Design",
      value: 35000,
      probability: 100,
      weightedValue: 35000,
      stage: "CLOSED_WON",
      pipelinePosition: 0,
      expectedCloseDate: daysAgo(60),
      actualCloseDate: daysAgo(55),
      closedStatus: "WON",
      source: "REFERRAL",
      projectType: "PRINT",
      estimatedHours: 120,
      companyId: companies["Pinnacle Financial"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(55),
    },
  });

  const deal7 = await prisma.deal.create({
    data: {
      name: "Greenleaf Organics - Packaging Redesign",
      value: 22000,
      probability: 0,
      weightedValue: 0,
      stage: "CLOSED_LOST",
      pipelinePosition: 0,
      expectedCloseDate: daysAgo(20),
      actualCloseDate: daysAgo(18),
      closedStatus: "LOST",
      lostReason: "PRICE",
      lostReasonNote: "Client felt the budget was too high for their current funding round. May revisit in Q3.",
      source: "CONTENT",
      projectType: "BRANDING",
      estimatedHours: 100,
      companyId: companies["Greenleaf Organics"].id,
      ownerId: sam.id,
      stageChangedAt: daysAgo(18),
    },
  });

  const deal8 = await prisma.deal.create({
    data: {
      name: "Atlas Real Estate - Property Listing Platform",
      value: 120000,
      probability: 50,
      weightedValue: 60000,
      stage: "DISCOVERY_CALL_SCHEDULED",
      pipelinePosition: 1,
      expectedCloseDate: daysFromNow(60),
      source: "WEBSITE",
      projectType: "WEB_DEVELOPMENT",
      estimatedHours: 520,
      companyId: companies["Atlas Real Estate"].id,
      ownerId: jordan.id,
      stageChangedAt: daysAgo(8),
    },
  });

  const deal9 = await prisma.deal.create({
    data: {
      name: "Drift Coffee - Brand & Packaging",
      value: 18000,
      probability: 70,
      weightedValue: 12600,
      stage: "PROPOSAL_REVIEWED",
      pipelinePosition: 4,
      expectedCloseDate: daysFromNow(21),
      source: "LINKEDIN",
      projectType: "BRANDING",
      estimatedHours: 80,
      companyId: companies["Drift Coffee Co"].id,
      ownerId: sam.id,
      stageChangedAt: daysAgo(4),
    },
  });

  const deal10 = await prisma.deal.create({
    data: {
      name: "Ironclad Security - Marketing Website",
      value: 55000,
      probability: 0,
      weightedValue: 0,
      stage: "CLOSED_LOST",
      pipelinePosition: 0,
      expectedCloseDate: daysAgo(15),
      actualCloseDate: daysAgo(12),
      closedStatus: "LOST",
      lostReason: "COMPETITOR",
      lostReasonNote: "Went with a competitor agency that had prior cybersecurity industry experience.",
      source: "PARTNER",
      projectType: "WEB_DESIGN",
      estimatedHours: 240,
      companyId: companies["Ironclad Security"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(12),
    },
  });

  const deal11 = await prisma.deal.create({
    data: {
      name: "Pinnacle Financial - Mobile Banking App UI",
      value: 130000,
      probability: 75,
      weightedValue: 97500,
      stage: "DECISION_MAKER",
      pipelinePosition: 5,
      expectedCloseDate: daysFromNow(20),
      source: "REFERRAL",
      projectType: "MOBILE_APP",
      estimatedHours: 560,
      companyId: companies["Pinnacle Financial"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(6),
    },
  });

  const deal12 = await prisma.deal.create({
    data: {
      name: "Meridian Health - Patient Portal UX",
      value: 68000,
      probability: 90,
      weightedValue: 61200,
      stage: "NEGOTIATION",
      pipelinePosition: 6,
      expectedCloseDate: daysFromNow(10),
      source: "REFERRAL",
      projectType: "UI_UX",
      estimatedHours: 280,
      companyId: companies["Meridian Health Group"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(2),
    },
  });

  const deal13 = await prisma.deal.create({
    data: {
      name: "Vertex SaaS - Marketing Video Series",
      value: 28000,
      probability: 100,
      weightedValue: 28000,
      stage: "CLOSED_WON",
      pipelinePosition: 0,
      expectedCloseDate: daysAgo(45),
      actualCloseDate: daysAgo(42),
      closedStatus: "WON",
      source: "WEBSITE",
      projectType: "VIDEO",
      estimatedHours: 90,
      companyId: companies["Vertex SaaS"].id,
      ownerId: alex.id,
      stageChangedAt: daysAgo(42),
    },
  });

  const deal14 = await prisma.deal.create({
    data: {
      name: "NovaTech - Trade Show Booth Design",
      value: 15000,
      probability: 55,
      weightedValue: 8250,
      stage: "PROPOSAL_NEEDED",
      pipelinePosition: 2,
      expectedCloseDate: daysFromNow(35),
      source: "COLD_OUTREACH",
      projectType: "PRINT",
      estimatedHours: 60,
      companyId: companies["NovaTech Industries"].id,
      ownerId: sam.id,
      stageChangedAt: daysAgo(6),
    },
  });

  const allDeals = {
    deal1,
    deal2,
    deal3,
    deal4,
    deal5,
    deal6,
    deal7,
    deal8,
    deal9,
    deal10,
    deal11,
    deal12,
    deal13,
    deal14,
  };
  console.log(`  Created ${Object.keys(allDeals).length} deals`);

  // Deal-tag associations
  await prisma.dealTag.createMany({
    data: [
      { dealId: deal1.id, tagId: tags["Repeat Client"].id },
      { dealId: deal2.id, tagId: tags["Hot Lead"].id },
      { dealId: deal3.id, tagId: tags["Design Sprint"].id },
      { dealId: deal5.id, tagId: tags["Enterprise"].id },
      { dealId: deal5.id, tagId: tags["Long-term"].id },
      { dealId: deal7.id, tagId: tags["At Risk"].id },
      { dealId: deal8.id, tagId: tags["Long-term"].id },
      { dealId: deal9.id, tagId: tags["Quick Win"].id },
      { dealId: deal10.id, tagId: tags["At Risk"].id },
      { dealId: deal11.id, tagId: tags["Enterprise"].id },
      { dealId: deal12.id, tagId: tags["Repeat Client"].id },
      { dealId: deal14.id, tagId: tags["Design Sprint"].id },
    ],
  });

  // =========================================================================
  // 6. DealContact associations
  // =========================================================================
  console.log("Creating deal-contact associations...");
  await prisma.dealContact.createMany({
    data: [
      // Meridian Health - Brand Identity
      { dealId: deal1.id, contactId: contacts["Diana Morales"].id, role: "DECISION_MAKER", isPrimary: true },
      { dealId: deal1.id, contactId: contacts["Tom Nguyen"].id, role: "CHAMPION", isPrimary: false },
      // Vertex SaaS - Product Dashboard UI
      { dealId: deal2.id, contactId: contacts["Priya Sharma"].id, role: "CHAMPION", isPrimary: true },
      { dealId: deal2.id, contactId: contacts["Marcus Lee"].id, role: "INFLUENCER", isPrimary: false },
      // Bloom & Branch - E-commerce Redesign
      { dealId: deal3.id, contactId: contacts["Olivia Hart"].id, role: "DECISION_MAKER", isPrimary: true },
      // Catalyst Ventures - Pitch Deck Design
      { dealId: deal4.id, contactId: contacts["Ryan Foster"].id, role: "DECISION_MAKER", isPrimary: true },
      { dealId: deal4.id, contactId: contacts["Elena Vasquez"].id, role: "STAKEHOLDER", isPrimary: false },
      // NovaTech - Corporate Website Overhaul
      { dealId: deal5.id, contactId: contacts["James Whitfield"].id, role: "CHAMPION", isPrimary: true },
      { dealId: deal5.id, contactId: contacts["Linda Park"].id, role: "INFLUENCER", isPrimary: false },
      // Pinnacle Financial - Annual Report
      { dealId: deal6.id, contactId: contacts["Catherine Blair"].id, role: "DECISION_MAKER", isPrimary: true },
      // Greenleaf Organics - Packaging Redesign
      { dealId: deal7.id, contactId: contacts["Derek Stone"].id, role: "CHAMPION", isPrimary: true },
      // Atlas Real Estate - Property Listing Platform
      { dealId: deal8.id, contactId: contacts["Rachel Kim"].id, role: "CHAMPION", isPrimary: true },
      { dealId: deal8.id, contactId: contacts["Ben Wallace"].id, role: "DECISION_MAKER", isPrimary: false },
      // Drift Coffee - Brand & Packaging
      { dealId: deal9.id, contactId: contacts["Mia Torres"].id, role: "DECISION_MAKER", isPrimary: true },
      // Ironclad Security - Marketing Website
      { dealId: deal10.id, contactId: contacts["Kevin Zhao"].id, role: "CHAMPION", isPrimary: true },
      { dealId: deal10.id, contactId: contacts["Sarah Mitchell"].id, role: "BLOCKER", isPrimary: false },
      // Pinnacle Financial - Mobile Banking App UI
      { dealId: deal11.id, contactId: contacts["Catherine Blair"].id, role: "DECISION_MAKER", isPrimary: true },
      // Meridian Health - Patient Portal UX
      { dealId: deal12.id, contactId: contacts["Diana Morales"].id, role: "DECISION_MAKER", isPrimary: true },
      { dealId: deal12.id, contactId: contacts["Tom Nguyen"].id, role: "STAKEHOLDER", isPrimary: false },
      // Vertex SaaS - Marketing Video Series
      { dealId: deal13.id, contactId: contacts["Priya Sharma"].id, role: "CHAMPION", isPrimary: true },
      // NovaTech - Trade Show Booth
      { dealId: deal14.id, contactId: contacts["James Whitfield"].id, role: "DECISION_MAKER", isPrimary: true },
    ],
  });
  console.log("  Created deal-contact associations");

  // =========================================================================
  // 7. DealStageHistory
  // =========================================================================
  console.log("Creating deal stage history...");
  await prisma.dealStageHistory.createMany({
    data: [
      // Deal 1: Meridian Health - Brand Identity (full pipeline to CLOSED_WON)
      { dealId: deal1.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(90), changedById: alex.id },
      { dealId: deal1.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(80), changedById: alex.id },
      { dealId: deal1.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(65), changedById: alex.id },
      { dealId: deal1.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(55), changedById: alex.id },
      { dealId: deal1.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(48), changedById: alex.id },
      { dealId: deal1.id, fromStage: "PROPOSAL_REVIEWED", toStage: "DECISION_MAKER", changedAt: daysAgo(42), changedById: alex.id },
      { dealId: deal1.id, fromStage: "DECISION_MAKER", toStage: "NEGOTIATION", changedAt: daysAgo(38), changedById: alex.id },
      { dealId: deal1.id, fromStage: "NEGOTIATION", toStage: "CONTRACT", changedAt: daysAgo(32), changedById: alex.id },
      { dealId: deal1.id, fromStage: "CONTRACT", toStage: "CLOSED_WON", changedAt: daysAgo(28), changedById: alex.id },

      // Deal 2: Vertex SaaS - Dashboard UI (progressed to CONTRACT)
      { dealId: deal2.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(40), changedById: alex.id },
      { dealId: deal2.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(32), changedById: alex.id },
      { dealId: deal2.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(22), changedById: alex.id },
      { dealId: deal2.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(15), changedById: alex.id },
      { dealId: deal2.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(10), changedById: alex.id },
      { dealId: deal2.id, fromStage: "PROPOSAL_REVIEWED", toStage: "NEGOTIATION", changedAt: daysAgo(7), changedById: alex.id },
      { dealId: deal2.id, fromStage: "NEGOTIATION", toStage: "CONTRACT", changedAt: daysAgo(5), changedById: alex.id },

      // Deal 3: Bloom & Branch (progressed to PROPOSAL_SENT)
      { dealId: deal3.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(20), changedById: sam.id },
      { dealId: deal3.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(14), changedById: sam.id },
      { dealId: deal3.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(8), changedById: sam.id },
      { dealId: deal3.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(3), changedById: sam.id },

      // Deal 4: Catalyst Ventures (moved to DISCOVERY_CALL_SCHEDULED)
      { dealId: deal4.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(15), changedById: jordan.id },
      { dealId: deal4.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(7), changedById: jordan.id },

      // Deal 5: NovaTech - Website Overhaul (just inquiry)
      { dealId: deal5.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(10), changedById: sam.id },

      // Deal 6: Pinnacle Financial - Annual Report (full pipeline to CLOSED_WON)
      { dealId: deal6.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(120), changedById: alex.id },
      { dealId: deal6.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(105), changedById: alex.id },
      { dealId: deal6.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(90), changedById: alex.id },
      { dealId: deal6.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(80), changedById: alex.id },
      { dealId: deal6.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(72), changedById: alex.id },
      { dealId: deal6.id, fromStage: "PROPOSAL_REVIEWED", toStage: "DECISION_MAKER", changedAt: daysAgo(68), changedById: alex.id },
      { dealId: deal6.id, fromStage: "DECISION_MAKER", toStage: "CONTRACT", changedAt: daysAgo(60), changedById: alex.id },
      { dealId: deal6.id, fromStage: "CONTRACT", toStage: "CLOSED_WON", changedAt: daysAgo(55), changedById: alex.id },

      // Deal 7: Greenleaf Organics (went to CLOSED_LOST from PROPOSAL_SENT)
      { dealId: deal7.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(50), changedById: sam.id },
      { dealId: deal7.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(42), changedById: sam.id },
      { dealId: deal7.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(35), changedById: sam.id },
      { dealId: deal7.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(28), changedById: sam.id },
      { dealId: deal7.id, fromStage: "PROPOSAL_SENT", toStage: "CLOSED_LOST", changedAt: daysAgo(18), changedById: sam.id },

      // Deal 8: Atlas Real Estate (moved to DISCOVERY_CALL_SCHEDULED)
      { dealId: deal8.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(18), changedById: jordan.id },
      { dealId: deal8.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(8), changedById: jordan.id },

      // Deal 9: Drift Coffee (progressed to PROPOSAL_REVIEWED)
      { dealId: deal9.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(14), changedById: sam.id },
      { dealId: deal9.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(10), changedById: sam.id },
      { dealId: deal9.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(7), changedById: sam.id },
      { dealId: deal9.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(5), changedById: sam.id },
      { dealId: deal9.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(4), changedById: sam.id },

      // Deal 10: Ironclad Security (went to CLOSED_LOST from NEGOTIATION)
      { dealId: deal10.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(60), changedById: alex.id },
      { dealId: deal10.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(50), changedById: alex.id },
      { dealId: deal10.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(35), changedById: alex.id },
      { dealId: deal10.id, fromStage: "PROPOSAL_SENT", toStage: "DECISION_MAKER", changedAt: daysAgo(25), changedById: alex.id },
      { dealId: deal10.id, fromStage: "DECISION_MAKER", toStage: "NEGOTIATION", changedAt: daysAgo(20), changedById: alex.id },
      { dealId: deal10.id, fromStage: "NEGOTIATION", toStage: "CLOSED_LOST", changedAt: daysAgo(12), changedById: alex.id },

      // Deal 11: Pinnacle - Mobile Banking App (progressed to DECISION_MAKER)
      { dealId: deal11.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(35), changedById: alex.id },
      { dealId: deal11.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(28), changedById: alex.id },
      { dealId: deal11.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(20), changedById: alex.id },
      { dealId: deal11.id, fromStage: "PROPOSAL_NEEDED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(14), changedById: alex.id },
      { dealId: deal11.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(10), changedById: alex.id },
      { dealId: deal11.id, fromStage: "PROPOSAL_REVIEWED", toStage: "DECISION_MAKER", changedAt: daysAgo(6), changedById: alex.id },

      // Deal 12: Meridian Health - Patient Portal (progressed to NEGOTIATION)
      { dealId: deal12.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(22), changedById: alex.id },
      { dealId: deal12.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(17), changedById: alex.id },
      { dealId: deal12.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(10), changedById: alex.id },
      { dealId: deal12.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(6), changedById: alex.id },
      { dealId: deal12.id, fromStage: "PROPOSAL_REVIEWED", toStage: "NEGOTIATION", changedAt: daysAgo(2), changedById: alex.id },

      // Deal 13: Vertex SaaS - Video Series (full pipeline to CLOSED_WON)
      { dealId: deal13.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(80), changedById: alex.id },
      { dealId: deal13.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(70), changedById: alex.id },
      { dealId: deal13.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_SENT", changedAt: daysAgo(58), changedById: alex.id },
      { dealId: deal13.id, fromStage: "PROPOSAL_SENT", toStage: "PROPOSAL_REVIEWED", changedAt: daysAgo(52), changedById: alex.id },
      { dealId: deal13.id, fromStage: "PROPOSAL_REVIEWED", toStage: "CONTRACT", changedAt: daysAgo(48), changedById: alex.id },
      { dealId: deal13.id, fromStage: "CONTRACT", toStage: "CLOSED_WON", changedAt: daysAgo(42), changedById: alex.id },

      // Deal 14: NovaTech - Trade Show Booth (moved to PROPOSAL_NEEDED)
      { dealId: deal14.id, fromStage: null, toStage: "INQUIRY", changedAt: daysAgo(16), changedById: sam.id },
      { dealId: deal14.id, fromStage: "INQUIRY", toStage: "DISCOVERY_CALL_SCHEDULED", changedAt: daysAgo(11), changedById: sam.id },
      { dealId: deal14.id, fromStage: "DISCOVERY_CALL_SCHEDULED", toStage: "PROPOSAL_NEEDED", changedAt: daysAgo(6), changedById: sam.id },
    ],
  });
  console.log("  Created deal stage history entries");

  // =========================================================================
  // 8. Notes
  // =========================================================================
  console.log("Creating notes...");
  await prisma.note.createMany({
    data: [
      // Company notes
      {
        content: "Meridian Health is expanding into three new states next year. Great opportunity to pitch a larger brand campaign alongside the identity work we already delivered.",
        companyId: companies["Meridian Health Group"].id,
        authorId: alex.id,
        isPinned: true,
        createdAt: daysAgo(5),
      },
      {
        content: "Vertex is going through a Series B raise. Timeline might shift but the budget is likely to increase. Keep in close contact with Priya.",
        companyId: companies["Vertex SaaS"].id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(8),
      },
      {
        content: "Bloom & Branch has a tight launch deadline for their new e-commerce site - they want to go live before Mother's Day. Need to factor that into our proposal timeline.",
        companyId: companies["Bloom & Branch Co"].id,
        authorId: sam.id,
        isPinned: true,
        createdAt: daysAgo(2),
      },
      {
        content: "NovaTech procurement process is slow. James says there are three levels of approval needed for anything above $50K. Expect 4-6 week sign-off cycle.",
        companyId: companies["NovaTech Industries"].id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(9),
      },
      {
        content: "Greenleaf reached out again asking about a smaller packaging-only project. They may not have budget for full rebrand but there could be a foot-in-the-door opportunity.",
        companyId: companies["Greenleaf Organics"].id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(4),
      },

      // Contact notes
      {
        content: "Diana is very design-savvy and asks detailed questions about our creative process. She appreciates when we share moodboards early. Prefers async communication via email over calls.",
        contactId: contacts["Diana Morales"].id,
        authorId: alex.id,
        isPinned: true,
        createdAt: daysAgo(12),
      },
      {
        content: "Priya mentioned she previously worked at Figma - she has strong opinions on design tooling. Make sure our team uses Figma for all deliverables on this account.",
        contactId: contacts["Priya Sharma"].id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(15),
      },
      {
        content: "Olivia is bootstrapping the company and is cost-conscious but values quality. Consider offering a phased approach with milestone payments.",
        contactId: contacts["Olivia Hart"].id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(3),
      },
      {
        content: "Kevin seems enthusiastic but Sarah (CTO) was skeptical about our capabilities in the cybersecurity space. We need case studies from similar industries.",
        contactId: contacts["Kevin Zhao"].id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(20),
      },
      {
        content: "Catherine mentioned the Pinnacle board meets quarterly. Next board meeting is in 3 weeks - she wants a demo-ready prototype by then to get budget approval for the mobile app.",
        contactId: contacts["Catherine Blair"].id,
        authorId: alex.id,
        isPinned: true,
        createdAt: daysAgo(6),
      },

      // Deal notes
      {
        content: "Sent the proposal for the dashboard UI. Priya wants interactive prototypes, not just static mockups. Adjusting SOW to include Figma prototype deliverables and adding 30 hours to estimate.",
        dealId: deal2.id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(6),
      },
      {
        content: "Bloom & Branch loved the mood board direction. Olivia especially liked the earthy, organic visual approach. She asked if we can include a custom illustration package - checking with the design team on pricing.",
        dealId: deal3.id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(3),
      },
      {
        content: "Ryan wants the pitch deck to tell a story - not just slides. Mentioned he has a big LP meeting in 6 weeks and wants it to feel premium. Good upsell opportunity for animation.",
        dealId: deal4.id,
        authorId: jordan.id,
        isPinned: false,
        createdAt: daysAgo(7),
      },
      {
        content: "Atlas deal is exciting but complex. They want property listing pages to pull data from their MLS integration. Need to loop in our dev team early to scope the API work.",
        dealId: deal8.id,
        authorId: jordan.id,
        isPinned: true,
        createdAt: daysAgo(5),
      },
      {
        content: "Mia wants the coffee packaging to stand out on shelves. She shared competitor packaging she likes (Blue Bottle, Stumptown). Our design team should research direct-to-consumer coffee brands.",
        dealId: deal9.id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(4),
      },
      {
        content: "Lost this deal to a competitor that specializes in cybersecurity marketing. We need to build more industry-specific case studies. Lesson learned.",
        dealId: deal10.id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(12),
      },
      {
        content: "Catherine is pushing for a reduced scope on the mobile app to hit a $100K budget. Discussing which features to cut from v1 while keeping the core UX intact.",
        dealId: deal11.id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(3),
      },
      {
        content: "Diana approved the patient portal project internally. Legal team is reviewing our MSA. Expect the signed contract within the next two weeks.",
        dealId: deal12.id,
        authorId: alex.id,
        isPinned: true,
        createdAt: daysAgo(2),
      },
      {
        content: "NovaTech trade show is in Dallas, March 15-17. James needs booth design concepts by end of February to get internal sign-off. Timeline is tight.",
        dealId: deal14.id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(5),
      },
      {
        content: "Brand identity project wrapped up successfully. Diana was thrilled with the final logo suite and brand guidelines. She mentioned wanting to expand into digital next quarter.",
        dealId: deal1.id,
        authorId: alex.id,
        isPinned: false,
        createdAt: daysAgo(28),
      },
      {
        content: "NovaTech website project scoping call went well. James is aligned on the phased approach. Need to get Linda from procurement involved for the next conversation.",
        dealId: deal5.id,
        authorId: sam.id,
        isPinned: false,
        createdAt: daysAgo(7),
      },
    ],
  });
  console.log("  Created 21 notes");

  // =========================================================================
  // 9. Activities
  // =========================================================================
  console.log("Creating activities...");
  await prisma.activity.createMany({
    data: [
      // Completed activities
      {
        type: "CALL",
        subject: "Discovery call with Priya - Vertex Dashboard",
        description: "Discussed requirements for the new product dashboard. Priya wants real-time data visualization, dark mode support, and mobile-responsive design. Budget is flexible if we can deliver by Q2.",
        dueDate: daysAgo(10),
        completedAt: daysAgo(10),
        duration: 45,
        status: "COMPLETED",
        priority: "HIGH",
        contactId: contacts["Priya Sharma"].id,
        dealId: deal2.id,
        companyId: companies["Vertex SaaS"].id,
        assignedToId: alex.id,
      },
      {
        type: "MEETING",
        subject: "Proposal presentation - Bloom & Branch",
        description: "In-person meeting to walk Olivia through the e-commerce redesign proposal. Bring printed lookbook and case studies from similar D2C brands.",
        dueDate: daysAgo(3),
        completedAt: daysAgo(3),
        duration: 60,
        status: "COMPLETED",
        priority: "HIGH",
        contactId: contacts["Olivia Hart"].id,
        dealId: deal3.id,
        companyId: companies["Bloom & Branch Co"].id,
        assignedToId: sam.id,
      },
      {
        type: "CALL",
        subject: "Closing call with Diana - Patient Portal UX",
        description: "Reviewed final contract terms. Diana confirmed executive approval. Waiting on legal for final sign-off.",
        dueDate: daysAgo(2),
        completedAt: daysAgo(2),
        duration: 30,
        status: "COMPLETED",
        priority: "URGENT",
        contactId: contacts["Diana Morales"].id,
        dealId: deal12.id,
        companyId: companies["Meridian Health Group"].id,
        assignedToId: alex.id,
      },
      {
        type: "TASK",
        subject: "Prepare NovaTech website proposal",
        description: "Draft the SOW and cost breakdown for the corporate website overhaul. Include phased timeline option.",
        dueDate: daysAgo(5),
        completedAt: daysAgo(4),
        duration: 120,
        status: "COMPLETED",
        priority: "MEDIUM",
        dealId: deal5.id,
        companyId: companies["NovaTech Industries"].id,
        assignedToId: sam.id,
      },
      {
        type: "MEETING",
        subject: "Post-mortem - Ironclad Security deal",
        description: "Internal team meeting to discuss what we can improve after losing the Ironclad deal. Focus on building cybersecurity industry expertise.",
        dueDate: daysAgo(10),
        completedAt: daysAgo(10),
        duration: 30,
        status: "COMPLETED",
        priority: "LOW",
        dealId: deal10.id,
        assignedToId: alex.id,
      },

      // Scheduled (upcoming) activities
      {
        type: "MEETING",
        subject: "Contract negotiation - Vertex Dashboard",
        description: "Review revised SOW with Priya and Marcus. Need to align on the interactive prototype deliverables and timeline adjustments.",
        dueDate: daysFromNow(3),
        status: "SCHEDULED",
        priority: "HIGH",
        contactId: contacts["Priya Sharma"].id,
        dealId: deal2.id,
        companyId: companies["Vertex SaaS"].id,
        assignedToId: alex.id,
      },
      {
        type: "FOLLOW_UP",
        subject: "Follow up with Ryan on pitch deck direction",
        description: "Send Ryan the revised creative brief and get confirmation on the storytelling approach before we start design.",
        dueDate: daysFromNow(2),
        status: "SCHEDULED",
        priority: "MEDIUM",
        contactId: contacts["Ryan Foster"].id,
        dealId: deal4.id,
        companyId: companies["Catalyst Ventures"].id,
        assignedToId: jordan.id,
      },
      {
        type: "CALL",
        subject: "Scoping call with Rachel - Atlas platform",
        description: "Deep dive into technical requirements for the property listing platform. Discuss MLS API integration, search functionality, and map views.",
        dueDate: daysFromNow(5),
        status: "SCHEDULED",
        priority: "HIGH",
        contactId: contacts["Rachel Kim"].id,
        dealId: deal8.id,
        companyId: companies["Atlas Real Estate"].id,
        assignedToId: jordan.id,
      },
      {
        type: "TASK",
        subject: "Create Drift Coffee packaging mockups",
        description: "Design three packaging concept directions for Mia to review. Focus on premium feel with sustainable materials.",
        dueDate: daysFromNow(7),
        status: "SCHEDULED",
        priority: "MEDIUM",
        dealId: deal9.id,
        companyId: companies["Drift Coffee Co"].id,
        assignedToId: sam.id,
      },

      // Overdue activities (past due dates, still scheduled)
      {
        type: "FOLLOW_UP",
        subject: "Send revised proposal to Pinnacle - Mobile App",
        description: "Catherine asked for a reduced scope option at $100K. Need to send the updated proposal with v1 feature set.",
        dueDate: daysAgo(2),
        status: "SCHEDULED",
        priority: "URGENT",
        contactId: contacts["Catherine Blair"].id,
        dealId: deal11.id,
        companyId: companies["Pinnacle Financial"].id,
        assignedToId: alex.id,
      },
      {
        type: "CALL",
        subject: "Check in with Derek - Greenleaf smaller project",
        description: "Derek reached out about a smaller packaging project. Call to discuss scope and see if we can get a quick win.",
        dueDate: daysAgo(1),
        status: "SCHEDULED",
        priority: "LOW",
        contactId: contacts["Derek Stone"].id,
        companyId: companies["Greenleaf Organics"].id,
        assignedToId: sam.id,
      },
      {
        type: "TASK",
        subject: "Prepare NovaTech trade show booth concepts",
        description: "Create three booth design directions for the Dallas trade show. James needs these ASAP for internal review.",
        dueDate: daysAgo(1),
        status: "SCHEDULED",
        priority: "HIGH",
        dealId: deal14.id,
        companyId: companies["NovaTech Industries"].id,
        assignedToId: sam.id,
      },
      {
        type: "FOLLOW_UP",
        subject: "Reconnect with Leo Grant on consulting opportunity",
        description: "Leo mentioned he might have a client who needs brand strategy work. Follow up to see if the referral is still warm.",
        dueDate: daysAgo(5),
        status: "SCHEDULED",
        priority: "LOW",
        contactId: contacts["Leo Grant"].id,
        assignedToId: jordan.id,
      },
    ],
  });
  console.log("  Created 13 activities");

  // =========================================================================
  // 10. Team (bonus - add a team for completeness)
  // =========================================================================
  console.log("Creating team...");
  const salesTeam = await prisma.team.create({
    data: {
      name: "Design Sales",
      description: "Core sales team for design and creative services",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: jordan.id, teamId: salesTeam.id, role: "LEAD" },
      { userId: alex.id, teamId: salesTeam.id, role: "MEMBER" },
      { userId: sam.id, teamId: salesTeam.id, role: "MEMBER" },
    ],
  });
  console.log("  Created team with 3 members");

  // =========================================================================
  // Done
  // =========================================================================
  console.log("\nSeed completed successfully!");
  console.log("Summary:");
  console.log("  - 3 users");
  console.log("  - 8 tags");
  console.log("  - 10 companies");
  console.log("  - 17 contacts");
  console.log("  - 14 deals");
  console.log("  - 21 deal-contact associations");
  console.log("  - 49 deal stage history entries");
  console.log("  - 21 notes");
  console.log("  - 13 activities");
  console.log("  - 1 team with 3 members");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
