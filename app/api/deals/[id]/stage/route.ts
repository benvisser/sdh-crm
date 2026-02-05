import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { updateDealStageSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthFromRequest(request);

    const { id } = await params;

    const body = await request.json();
    const parsed = updateDealStageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const { stage, lostReason, lostReasonNote } = parsed.data;
    const fromStage = existing.stage;
    const now = new Date();

    const updateData: Record<string, unknown> = {
      stage,
      stageChangedAt: now,
    };

    if (stage === "CLOSED_WON") {
      updateData.closedStatus = "WON";
      updateData.actualCloseDate = now;
      updateData.probability = 100;
      updateData.weightedValue = Number(existing.value);
    } else if (stage === "CLOSED_LOST") {
      updateData.closedStatus = "LOST";
      updateData.actualCloseDate = now;
      updateData.probability = 0;
      updateData.weightedValue = 0;
      if (lostReason) {
        updateData.lostReason = lostReason;
      }
      if (lostReasonNote) {
        updateData.lostReasonNote = lostReasonNote;
      }
    }

    const [deal] = await prisma.$transaction([
      prisma.deal.update({
        where: { id },
        data: updateData,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.dealStageHistory.create({
        data: {
          dealId: id,
          fromStage,
          toStage: stage,
          changedById: auth.userId,
        },
      }),
    ]);

    return NextResponse.json({ data: deal });
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
