import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthFromRequest } from "@/lib/auth";
import { searchSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await requireAuthFromRequest(request);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const parsed = searchSchema.safeParse({ q });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const query = parsed.data.q;

    const [companies, contacts, deals] = await Promise.all([
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { domain: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          domain: true,
          type: true,
        },
        take: 5,
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5,
      }),
      prisma.deal.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          value: true,
          stage: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      data: {
        companies,
        contacts,
        deals,
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
