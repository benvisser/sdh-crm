import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { createActivitySchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await requireAuthFromRequest(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const assignedTo = searchParams.get("assignedTo") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: Record<string, unknown> = {};

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.dueDate = {};
      if (dateFrom) {
        (where.dueDate as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.dueDate as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
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
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              name: true,
              stage: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      data: activities,
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
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { completed, dueDate, ...rest } = parsed.data;

    const activityData: Record<string, unknown> = {
      ...rest,
      assignedToId: auth.userId,
    };

    if (dueDate) {
      activityData.dueDate = new Date(dueDate);
    }

    if (completed) {
      activityData.status = "COMPLETED";
      activityData.completedAt = new Date();
    }

    const activity = await prisma.activity.create({
      data: activityData as Parameters<typeof prisma.activity.create>[0]["data"],
      include: {
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
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
            stage: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: activity }, { status: 201 });
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
