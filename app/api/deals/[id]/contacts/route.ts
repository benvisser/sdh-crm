import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { addDealContactSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request);

    const { id } = await params;

    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const dealContacts = await prisma.dealContact.findMany({
      where: { dealId: id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            phone: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: dealContacts });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request);

    const { id } = await params;

    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addDealContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id: parsed.data.contactId },
    });
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check if the contact is already linked to this deal
    const existingLink = await prisma.dealContact.findUnique({
      where: {
        dealId_contactId: {
          dealId: id,
          contactId: parsed.data.contactId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Contact is already linked to this deal" },
        { status: 409 }
      );
    }

    const dealContact = await prisma.dealContact.create({
      data: {
        dealId: id,
        contactId: parsed.data.contactId,
        role: parsed.data.role,
        isPrimary: parsed.data.isPrimary,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });

    return NextResponse.json({ data: dealContact }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request);

    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId query parameter is required" },
        { status: 400 }
      );
    }

    const dealContact = await prisma.dealContact.findUnique({
      where: {
        dealId_contactId: {
          dealId: id,
          contactId,
        },
      },
    });

    if (!dealContact) {
      return NextResponse.json(
        { error: "Deal contact link not found" },
        { status: 404 }
      );
    }

    await prisma.dealContact.delete({
      where: {
        dealId_contactId: {
          dealId: id,
          contactId,
        },
      },
    });

    return NextResponse.json({ data: { message: "Contact removed from deal" } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
