import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { createNoteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthFromRequest(request);

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { companyId, contactId, dealId, content, isPinned } = parsed.data;

    // Must have at least one of companyId, contactId, or dealId
    if (!companyId && !contactId && !dealId) {
      return NextResponse.json(
        { error: "At least one of companyId, contactId, or dealId is required" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content,
        isPinned,
        companyId,
        contactId,
        dealId,
        authorId: auth.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
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
