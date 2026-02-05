import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAuthFromRequest(request);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      openPipelineResult,
      dealsClosingThisMonth,
      wonThisMonthDeals,
      activitiesDueToday,
      pipelineByStage,
      recentDeals,
      upcomingActivities,
    ] = await Promise.all([
      // openPipelineValue: sum of value for deals where closedStatus is null
      prisma.deal.aggregate({
        where: { closedStatus: null },
        _sum: { value: true },
      }),

      // dealsClosingThisMonth: count of deals where expectedCloseDate is in current month and closedStatus is null
      prisma.deal.count({
        where: {
          closedStatus: null,
          expectedCloseDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // wonThisMonth: deals closed won this month
      prisma.deal.aggregate({
        where: {
          closedStatus: "WON",
          actualCloseDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _count: true,
        _sum: { value: true },
      }),

      // activitiesDueToday: count of activities due today for current user with status SCHEDULED or IN_PROGRESS
      prisma.activity.count({
        where: {
          assignedToId: auth.userId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // pipelineByStage: array of { stage, count, totalValue } for open deals grouped by stage
      prisma.deal.groupBy({
        by: ["stage"],
        where: { closedStatus: null },
        _count: true,
        _sum: { value: true },
      }),

      // recentDeals: last 10 deals with company and owner
      prisma.deal.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          company: {
            select: {
              id: true,
              name: true,
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

      // upcomingActivities: next 5 activities for current user
      prisma.activity.findMany({
        where: {
          assignedToId: auth.userId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          dueDate: { gte: now },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
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
            },
          },
          deal: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        openPipelineValue: openPipelineResult._sum.value ?? 0,
        dealsClosingThisMonth,
        wonThisMonth: {
          count: wonThisMonthDeals._count,
          value: wonThisMonthDeals._sum.value ?? 0,
        },
        activitiesDueToday,
        pipelineByStage: pipelineByStage.map((item) => ({
          stage: item.stage,
          count: item._count,
          totalValue: item._sum.value ?? 0,
        })),
        recentDeals,
        upcomingActivities,
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
