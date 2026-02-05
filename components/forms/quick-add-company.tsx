"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { createCompanySchema } from "@/lib/validations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const quickAddCompanySchema = createCompanySchema.pick({
  name: true,
  website: true,
  industry: true,
  type: true,
  phone: true,
});

type QuickAddCompanyFormValues = z.infer<typeof quickAddCompanySchema>;

const COMPANY_TYPE_OPTIONS = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "LEAD", label: "Lead" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "FORMER_CUSTOMER", label: "Former Customer" },
  { value: "PARTNER", label: "Partner" },
  { value: "COMPETITOR", label: "Competitor" },
] as const;

interface QuickAddCompanyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuickAddCompany({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddCompanyProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuickAddCompanyFormValues>({
    resolver: zodResolver(quickAddCompanySchema),
    defaultValues: {
      name: "",
      website: "",
      industry: "",
      phone: "",
    },
  });

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: QuickAddCompanyFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create company");
      }

      toast.success("Company created successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create company"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="Acme Inc."
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input
              id="company-website"
              placeholder="https://example.com"
              {...register("website")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-industry">Industry</Label>
            <Input
              id="company-industry"
              placeholder="Technology"
              {...register("industry")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-type">Type</Label>
            <Select
              onValueChange={(value) =>
                setValue("type", value as QuickAddCompanyFormValues["type"])
              }
            >
              <SelectTrigger id="company-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone</Label>
            <Input
              id="company-phone"
              placeholder="+1 (555) 000-0000"
              {...register("phone")}
            />
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
              {isSubmitting ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
