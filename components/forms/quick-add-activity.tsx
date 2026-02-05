"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { createActivitySchema } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const quickAddActivitySchema = createActivitySchema.pick({
  type: true,
  subject: true,
  dueDate: true,
  priority: true,
  description: true,
  completed: true,
  companyId: true,
  contactId: true,
  dealId: true,
});

type QuickAddActivityFormValues = z.infer<typeof quickAddActivitySchema>;

const ACTIVITY_TYPE_OPTIONS = [
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
  { value: "TASK", label: "Task" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "DEMO", label: "Demo" },
  { value: "PRESENTATION", label: "Presentation" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

interface QuickAddActivityProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDealId?: string;
  defaultCompanyId?: string;
  defaultContactId?: string;
}

export function QuickAddActivity({
  open,
  onOpenChange,
  onSuccess,
  defaultDealId,
  defaultCompanyId,
  defaultContactId,
}: QuickAddActivityProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickAddActivityFormValues>({
    resolver: zodResolver(quickAddActivitySchema),
    defaultValues: {
      subject: "",
      description: "",
      dueDate: "",
      completed: false,
      dealId: defaultDealId ?? "",
      companyId: defaultCompanyId ?? "",
      contactId: defaultContactId ?? "",
    },
  });

  const completed = watch("completed");

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      reset({
        subject: "",
        description: "",
        dueDate: "",
        completed: false,
        dealId: defaultDealId ?? "",
        companyId: defaultCompanyId ?? "",
        contactId: defaultContactId ?? "",
      });
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: QuickAddActivityFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        dealId: data.dealId || undefined,
        companyId: data.companyId || undefined,
        contactId: data.contactId || undefined,
        dueDate: data.dueDate || undefined,
        status: data.completed ? ("COMPLETED" as const) : undefined,
      };

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create activity");
      }

      toast.success("Activity created successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create activity"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "type",
                  value as QuickAddActivityFormValues["type"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger id="activity-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="activity-subject"
              placeholder="Follow up on proposal"
              {...register("subject")}
              aria-invalid={!!errors.subject}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-due-date">Due Date</Label>
            <Input
              id="activity-due-date"
              type="date"
              {...register("dueDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-priority">Priority</Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "priority",
                  value as QuickAddActivityFormValues["priority"]
                )
              }
            >
              <SelectTrigger id="activity-priority" className="w-full">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-description">Description</Label>
            <Textarea
              id="activity-description"
              placeholder="Add any notes or details..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="activity-completed"
              type="checkbox"
              checked={completed ?? false}
              onChange={(e) => setValue("completed", e.target.checked)}
              className="border-input focus-visible:ring-ring/50 size-4 rounded border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Label htmlFor="activity-completed" className="cursor-pointer">
              Log as Completed
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
