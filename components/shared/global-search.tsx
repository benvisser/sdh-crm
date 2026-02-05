"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, Handshake } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface SearchResults {
  companies: Array<{ id: string; name: string; domain?: string }>;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  }>;
  deals: Array<{ id: string; name: string; value: string }>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data);
        }
      } catch {
        // ignore search errors
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-72 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search companies, contacts, deals..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {results?.companies && results.companies.length > 0 && (
            <CommandGroup heading="Companies">
              {results.companies.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => navigate(`/companies/${c.id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{c.name}</span>
                  {c.domain && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      {c.domain}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.contacts && results.contacts.length > 0 && (
            <CommandGroup heading="Contacts">
              {results.contacts.map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => navigate(`/contacts/${c.id}`)}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {c.firstName} {c.lastName}
                  </span>
                  {c.email && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      {c.email}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.deals && results.deals.length > 0 && (
            <CommandGroup heading="Deals">
              {results.deals.map((d) => (
                <CommandItem
                  key={d.id}
                  onSelect={() => navigate(`/deals/${d.id}`)}
                >
                  <Handshake className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{d.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
