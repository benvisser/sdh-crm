"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ImportFile {
  type: "companies" | "contacts" | "deals";
  file: File | null;
  uploaded: boolean;
  recordCount?: number;
}

interface BackupFile {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
}

export default function ImportPage() {
  const [importFiles, setImportFiles] = useState<ImportFile[]>([
    { type: "companies", file: null, uploaded: false },
    { type: "contacts", file: null, uploaded: false },
    { type: "deals", file: null, uploaded: false },
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [importProgress, setImportProgress] = useState<{
    step: string;
    progress: number;
    completed: boolean;
  } | null>(null);

  const fileInputRefs = {
    companies: useRef<HTMLInputElement>(null),
    contacts: useRef<HTMLInputElement>(null),
    deals: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = (
    type: "companies" | "contacts" | "deals",
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const recordCount = Math.max(0, lines.length - 1);

      setImportFiles((prev) =>
        prev.map((item) =>
          item.type === type
            ? { ...item, file, uploaded: true, recordCount }
            : item
        )
      );
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} file uploaded - ${recordCount} records detected`
      );
    };
    reader.readAsText(file);
  };

  const handleBackupDatabase = useCallback(async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/import/backup", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Backup failed");

      const result = await response.json();
      setBackups((prev) => [result.backup, ...prev]);
      toast.success("Database backup created successfully");
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      const response = await fetch("/api/import/backup");
      if (response.ok) {
        const result = await response.json();
        setBackups(result.backups || []);
      }
    } catch (error) {
      console.error("Failed to load backups:", error);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleImport = async () => {
    const uploadedFiles = importFiles.filter((item) => item.uploaded);
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one CSV file");
      return;
    }

    setIsImporting(true);
    setImportProgress({
      step: "Preparing import...",
      progress: 0,
      completed: false,
    });

    try {
      // Auto-backup before import
      setImportProgress({
        step: "Creating backup...",
        progress: 10,
        completed: false,
      });
      await handleBackupDatabase();

      // Upload and import
      setImportProgress({
        step: "Processing files...",
        progress: 30,
        completed: false,
      });
      const formData = new FormData();
      uploadedFiles.forEach((item) => {
        if (item.file) {
          formData.append(item.type, item.file);
        }
      });

      setImportProgress({
        step: "Importing data...",
        progress: 60,
        completed: false,
      });
      const response = await fetch("/api/import/hubspot", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Import failed");
      }

      const result = await response.json();

      setImportProgress({
        step: "Import completed!",
        progress: 100,
        completed: true,
      });
      toast.success(
        `Import completed! ${result.imported} records imported`
      );

      // Clear uploaded files
      setImportFiles((prev) =>
        prev.map((item) => ({
          ...item,
          file: null,
          uploaded: false,
          recordCount: undefined,
        }))
      );
    } catch (error) {
      setImportProgress(null);
      const message =
        error instanceof Error ? error.message : "Import failed";
      toast.error(`Import failed: ${message}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(null), 3000);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (
      !confirm(
        "This will restore your database to a previous state. All current data will be lost. Continue?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/import/restore/${backupId}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Restore failed");

      toast.success("Database restored successfully. Refreshing page...");
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      toast.error("Failed to restore backup");
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "companies":
        return <Building2 className="w-5 h-5" />;
      case "contacts":
        return <Users className="w-5 h-5" />;
      case "deals":
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  const anyFileUploaded = importFiles.some((item) => item.uploaded);
  const totalRecords = importFiles.reduce(
    (sum, item) => sum + (item.recordCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            HubSpot Import
          </h1>
          <p className="text-sm text-muted-foreground">
            Import your CRM data safely with automatic backups
          </p>
        </div>
      </div>

      {/* Import Progress */}
      {importProgress && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {importProgress.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {importProgress.step}
                </p>
                <div className="mt-2 bg-white rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-slate-600">
                {importProgress.progress}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Upload className="w-6 h-6 text-blue-600" />
            Upload HubSpot Export Files
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload your CSV exports from HubSpot. All three file types are
            recommended for complete data migration.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {importFiles.map((item) => (
            <div key={item.type} className="group">
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-6 transition-all duration-200
                  ${
                    item.uploaded
                      ? "border-green-300 bg-green-50/50"
                      : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"
                  }
                `}
                onClick={() =>
                  !item.uploaded &&
                  fileInputRefs[item.type]?.current?.click()
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${
                        item.uploaded
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                      }
                    `}
                  >
                    {item.uploaded ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 capitalize">
                      {item.type} Export
                      {item.uploaded && item.recordCount !== undefined && (
                        <Badge variant="secondary" className="ml-2">
                          {item.recordCount.toLocaleString()} records
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.uploaded
                        ? `File: ${item.file?.name}`
                        : `Upload your HubSpot ${item.type} export CSV file`}
                    </p>
                  </div>
                  {!item.uploaded && (
                    <Button variant="outline" size="sm">
                      Choose File
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRefs[item.type]}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(item.type, file);
                }}
              />
            </div>
          ))}

          {anyFileUploaded && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Ready to Import
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {totalRecords.toLocaleString()} total records across{" "}
                    {importFiles.filter((f) => f.uploaded).length} files
                  </p>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                >
                  {isImporting ? "Importing..." : "Start Import"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-600" />
              Database Backups
            </div>
            <Button
              onClick={handleBackupDatabase}
              disabled={isBackingUp}
              variant="outline"
              className="border-emerald-200 hover:bg-emerald-50"
            >
              {isBackingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage database backups to safely rollback if needed.
          </p>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-medium text-slate-900 mb-2">
                No backups yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first backup before importing data
              </p>
              <Button
                onClick={handleBackupDatabase}
                disabled={isBackingUp}
              >
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm">
                        {backup.filename}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {(backup.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(backup.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(backup.id)}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">
                Important Notes
              </h3>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>
                  &bull; A database backup will be created automatically
                  before importing
                </li>
                <li>
                  &bull; Existing seed data will be replaced with your
                  HubSpot data
                </li>
                <li>
                  &bull; User accounts and settings will be preserved
                </li>
                <li>
                  &bull; You can restore from any backup if something goes
                  wrong
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
