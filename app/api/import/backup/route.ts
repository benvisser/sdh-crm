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

export async function POST(request: Request) {
  try {
    await requireAuthFromRequest(request);

    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `agency-crm-backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const db = parseDbUrl();
    const pgDump = getPgBinPath("pg_dump");

    execSync(
      `"${pgDump}" -h ${db.hostname} -p ${db.port} -U ${db.username} -d ${db.database} --clean --if-exists -f "${filepath}"`,
      {
        env: { ...process.env, PGPASSWORD: db.password },
        timeout: 30000,
      }
    );

    const stats = fs.statSync(filepath);

    return NextResponse.json({
      success: true,
      backup: {
        id: timestamp,
        filename,
        size: stats.size,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Backup failed:", error);
    return NextResponse.json(
      { error: "Failed to create database backup" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await requireAuthFromRequest(request);

    try {
      const files = fs.readdirSync(BACKUP_DIR);
      const backups = files
        .filter((file) => file.endsWith(".sql"))
        .map((file) => {
          const filepath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filepath);
          const match = file.match(/agency-crm-backup-(.+)\.sql/);
          const id = match ? match[1] : file;

          return {
            id,
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return NextResponse.json({ backups });
    } catch {
      return NextResponse.json({ backups: [] });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to list backups" },
      { status: 500 }
    );
  }
}
