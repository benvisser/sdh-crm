"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { createDealSchema } from "@/lib/validations";
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

const quickAddDealSchema = createDealSchema.pick({
  name: true,
  companyId: true,
  value: true,
  expectedCloseDate: true,
  projectType: true,
});

type QuickAddDealFormValues = z.infer<typeof quickAddDealSchema>;

const PROJECT_TYPE_OPTIONS = [
  { value: "BRANDING", label: "Branding" },
  { value: "WEB_DESIGN", label: "Web Design" },
  { value: "WEB_DEVELOPMENT", label: "Web Development" },
  { value: "MOBILE_APP", label: "Mobile App" },
  { value: "UI_UX", label: "UI/UX" },
  { value: "PRINT", label: "Print" },
  { value: "MARKETING", label: "Marketing" },
  { value: "VIDEO", label: "Video" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "OTHER", label: "Other" },
] as const;

interface Company {
  id: string;
  name: string;
}

interface QuickAddDealProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultCompanyId?: string;
}

export function QuickAddDeal({
  open,
  onOpenChange,
  onSuccess,
  defaultCompanyId,
}: QuickAddDealProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuickAddDealFormValues>({
    resolver: zodResolver(quickAddDealSchema),
    defaultValues: {
      name: "",
      companyId: defaultCompanyId ?? "",
      value: 0,
      expectedCloseDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingCompanies(true);
      fetch("/api/companies")
        .then((res) => res.json())
        .then((data) => {
          const companyList = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
          setCompanies(companyList);
        })
        .catch(() => {
          setCompanies([]);
        })
        .finally(() => setLoadingCompanies(false));
    }
  }, [open]);

  useEffect(() => {
    if (open && defaultCompanyId) {
      setValue("companyId", defaultCompanyId);
    }
  }, [open, defaultCompanyId, setValue]);

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      reset({
        name: "",
        companyId: defaultCompanyId ?? "",
        value: 0,
        expectedCloseDate: "",
      });
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: QuickAddDealFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create deal");
      }

      toast.success("Deal created successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create deal"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-name">
              Deal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deal-name"
              placeholder="Website Redesign"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={defaultCompanyId}
              onValueChange={(value) => setValue("companyId", value)}
            >
              <SelectTrigger id="deal-company" className="w-full">
                <SelectValue
                  placeholder={
                    loadingCompanies ? "Loading companies..." : "Select company"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && (
              <p className="text-sm text-destructive">
                {errors.companyId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-value">
              Value <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="deal-value"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                {...register("value", { valueAsNumber: true })}
                aria-invalid={!!errors.value}
              />
            </div>
            {errors.value && (
              <p className="text-sm text-destructive">
                {errors.value.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-close-date">
              Expected Close Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deal-close-date"
              type="date"
              {...register("expectedCloseDate")}
              aria-invalid={!!errors.expectedCloseDate}
            />
            {errors.expectedCloseDate && (
              <p className="text-sm text-destructive">
                {errors.expectedCloseDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-project-type">Project Type</Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "projectType",
                  value as QuickAddDealFormValues["projectType"]
                )
              }
            >
              <SelectTrigger id="deal-project-type" className="w-full">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
