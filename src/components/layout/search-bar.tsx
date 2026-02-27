"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  category: string | null;
}

interface SearchBarProps {
  /** Additional class names for the wrapper. */
  className?: string;
  /** Compact mode renders a shorter input (used in navbar). */
  compact?: boolean;
  /** Placeholder text. */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// SearchBar
// ---------------------------------------------------------------------------

export function SearchBar({
  className,
  compact = false,
  placeholder = "Search creators...",
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [expanded, setExpanded] = React.useState(false);

  // Debounce timer ref
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch search results (debounced) ────────────────────────────────────
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=6`,
        );
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch {
        // Silently fail — search is non-critical
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // ── Click outside to close ──────────────────────────────────────────────
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Submit search ───────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setExpanded(false);
      inputRef.current?.blur();
    }
  }

  // ── Navigate to a result ────────────────────────────────────────────────
  function handleSelectResult(result: SearchResult) {
    router.push(`/${result.username}`);
    setQuery("");
    setIsOpen(false);
    setExpanded(false);
  }

  // ── Keyboard navigation ─────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelectResult(results[activeIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }

  // ── Clear input ─────────────────────────────────────────────────────────
  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} role="search">
        <div
          className={cn(
            "relative flex items-center rounded-lg border border-border bg-dark-100 transition-all",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30",
            compact && !expanded && "w-10 md:w-64",
            compact && expanded && "w-64",
            !compact && "w-full",
          )}
        >
          {/* Search icon / expand trigger for mobile compact mode */}
          <button
            type={compact && !expanded ? "button" : "submit"}
            onClick={() => {
              if (compact && !expanded) {
                setExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }
            }}
            className="flex shrink-0 items-center justify-center px-3 text-muted-foreground hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "h-9 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
              "outline-none",
              compact && !expanded && "hidden md:block",
            )}
            aria-label="Search creators"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
            }
            role="combobox"
            autoComplete="off"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex shrink-0 items-center justify-center px-2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
            </div>
          )}
        </div>
      </form>

      {/* ── Dropdown results ────────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="search-results"
          role="listbox"
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-lg",
            "border border-border bg-popover shadow-dark-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
          )}
        >
          <div className="p-1">
            {results.map((result, index) => (
              <button
                key={result.id}
                id={`search-result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelectResult(result)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent",
                )}
              >
                {/* Creator avatar */}
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-dark-200">
                  <Image
                    src={result.avatarUrl || DEFAULT_AVATAR_URL}
                    alt={result.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>

                {/* Creator info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{result.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{result.username}
                    {result.category && (
                      <span className="ml-1.5 text-primary">
                        &middot; {result.category}
                      </span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* View all link */}
          {query.trim() && (
            <div className="border-t border-border p-1">
              <button
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                Search for &ldquo;{query.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
