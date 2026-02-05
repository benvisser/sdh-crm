import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { createDealSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await requireAuthFromRequest(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const stage = searchParams.get("stage") || "";
    const ownerId = searchParams.get("ownerId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: Record<string, unknown> = {};

    if (stage) {
      where.stage = stage;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (dateFrom || dateTo) {
      where.expectedCloseDate = {};
      if (dateFrom) {
        (where.expectedCloseDate as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.expectedCloseDate as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

export async function POST(request: Request) {
  try {
    const auth = await requireAuthFromRequest(request);

    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { expectedCloseDate, ...rest } = parsed.data;
    const probability = rest.probability ?? 50;
    const weightedValue = rest.value * probability / 100;

    const deal = await prisma.deal.create({
      data: {
        ...rest,
        probability,
        weightedValue,
        expectedCloseDate: new Date(expectedCloseDate),
        ownerId: auth.userId,
        stageHistory: {
          create: {
            fromStage: null,
            toStage: rest.stage || "QUALIFIED",
            changedById: auth.userId,
          },
        },
      },
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
    });

    return NextResponse.json({ data: deal }, { status: 201 });
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
