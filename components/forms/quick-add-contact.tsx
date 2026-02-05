"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { createContactSchema } from "@/lib/validations";
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

const quickAddContactSchema = createContactSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyId: true,
  jobTitle: true,
});

type QuickAddContactFormValues = z.infer<typeof quickAddContactSchema>;

interface Company {
  id: string;
  name: string;
}

interface QuickAddContactProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultCompanyId?: string;
}

export function QuickAddContact({
  open,
  onOpenChange,
  onSuccess,
  defaultCompanyId,
}: QuickAddContactProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuickAddContactFormValues>({
    resolver: zodResolver(quickAddContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: defaultCompanyId ?? "",
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
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        companyId: defaultCompanyId ?? "",
      });
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: QuickAddContactFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        companyId: data.companyId || undefined,
      };

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create contact");
      }

      toast.success("Contact created successfully");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create contact"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-first-name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-first-name"
                placeholder="John"
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-last-name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-last-name"
                placeholder="Doe"
                {...register("lastName")}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              placeholder="+1 (555) 000-0000"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-company">Company</Label>
            <Select
              defaultValue={defaultCompanyId}
              onValueChange={(value) => setValue("companyId", value)}
            >
              <SelectTrigger id="contact-company" className="w-full">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-job-title">Job Title</Label>
            <Input
              id="contact-job-title"
              placeholder="Software Engineer"
              {...register("jobTitle")}
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
              {isSubmitting ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
