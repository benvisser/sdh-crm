import { NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "db-backups");

function getPgBinPath(tool: string): string {
  const pgBin = process.env.PG_BIN_PATH || "/usr/local/opt/postgresql@14/bin";
  return path.join(pgBin, tool);
}

function parseDbUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");

  const url = new URL(dbUrl);
  return {
    hostname: url.hostname,
    port: url.port || "5432",
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthFromRequest(request);

    const { id } = await params;

    // Sanitize ID to prevent path traversal
    if (!/^[a-zA-Z0-9_.-]+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid backup ID" },
        { status: 400 }
      );
    }

    const filename = `agency-crm-backup-${id}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "Backup file not found" },
        { status: 404 }
      );
    }

    const db = parseDbUrl();
    const psql = getPgBinPath("psql");

    execSync(
      `"${psql}" -h ${db.hostname} -p ${db.port} -U ${db.username} -d ${db.database} -f "${filepath}"`,
      {
        env: { ...process.env, PGPASSWORD: db.password },
        timeout: 60000,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Database restored successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Restore failed:", error);
    return NextResponse.json(
      { error: "Failed to restore database" },
      { status: 500 }
    );
  }
}
