"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/shared/global-search";

interface HeaderProps {
  onQuickAdd: (type: "deal" | "company" | "contact" | "activity") => void;
}

export function Header({ onQuickAdd }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <GlobalSearch />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onQuickAdd("deal")}>
            New Deal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuickAdd("company")}>
            New Company
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuickAdd("contact")}>
            New Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onQuickAdd("activity")}>
            Log Activity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
