// ============================================================================
// Explore / Discover Page — Browse and discover creators
// ============================================================================

"use client";

import * as React from "react";
import {
  Search,
  TrendingUp,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { categories } from "@/config/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = "popular" | "new" | "trending";

// ---------------------------------------------------------------------------
// ExplorePage
// ---------------------------------------------------------------------------

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    searchParams.get("category"),
  );
  const [sortBy, setSortBy] = React.useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "popular",
  );

  // Featured creators
  const [featured, setFeatured] = React.useState<CreatorCardData[]>([]);
  const [featuredLoading, setFeaturedLoading] = React.useState(true);
  const featuredScrollRef = React.useRef<HTMLDivElement>(null);

  // Trending creators
  const [trending, setTrending] = React.useState<CreatorCardData[]>([]);
  const [trendingLoading, setTrendingLoading] = React.useState(true);

  // All creators grid
  const [creators, setCreators] = React.useState<CreatorCardData[]>([]);
  const [creatorsLoading, setCreatorsLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);

  // Fetch featured creators
  React.useEffect(() => {
    let cancelled = false;
    setFeaturedLoading(true);

    fetch("/api/creators/featured")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setFeatured(data.creators ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch trending creators
  React.useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);

    fetch("/api/creators/trending")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTrending(data.creators ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch creators grid
  const fetchCreators = React.useCallback(
    async (pageNum: number, reset = false) => {
      try {
        setCreatorsLoading(true);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "12",
          sort: sortBy,
        });
        if (selectedCategory) params.set("category", selectedCategory);

        const res = await fetch(`/api/creators?${params}`);
        const data = await res.json();
        const newCreators = data.creators ?? [];

        setCreators((prev) => (reset ? newCreators : [...prev, ...newCreators]));
        setHasMore(newCreators.length === 12);
      } catch (error) {
        console.error("[ExplorePage] Error fetching creators:", error);
      } finally {
        setCreatorsLoading(false);
      }
    },
    [sortBy, selectedCategory],
  );

  // Reset and fetch on filter change
  React.useEffect(() => {
    setPage(1);
    setCreators([]);
    setHasMore(true);
    fetchCreators(1, true);
  }, [fetchCreators]);

  const loadMore = React.useCallback(() => {
    if (creatorsLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCreators(nextPage);
  }, [creatorsLoading, page, fetchCreators]);

  // Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Category filter
  const handleCategoryClick = (slug: string) => {
    setSelectedCategory((prev) => (prev === slug ? null : slug));
  };

  // Sort option
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  // Featured carousel scroll
  const scrollFeatured = (direction: "left" | "right") => {
    const el = featuredScrollRef.current;
    if (!el) return;
    const scrollAmount = 320;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-8">
      {/* Page header + search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Explore</h1>
          <p className="text-sm text-muted-foreground">
            Discover talented creators and exclusive content
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </form>
      </div>

      {/* Featured creators carousel */}
      {!featuredLoading && featured.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Star className="h-5 w-5 fill-primary text-primary" />
              Featured Creators
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => scrollFeatured("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => scrollFeatured("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={featuredScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
          >
            {featured.map((creator) => (
              <div key={creator.id} className="w-72 shrink-0">
                <CreatorCard creator={creator} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending creators */}
      {!trendingLoading && trending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Now
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.slice(0, 3).map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </section>
      )}

      {/* All creators with filters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            All Creators
          </h2>
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="mr-1 h-4 w-4 text-muted-foreground" />
            {(["popular", "new", "trending"] as SortOption[]).map((option) => (
              <Button
                key={option}
                variant={sortBy === option ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSortChange(option)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                "hover:border-primary/50 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedCategory === cat.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}

          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Creator grid */}
        {creatorsLoading && creators.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" label="Loading creators" />
          </div>
        ) : creators.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No creators found"
            description={
              selectedCategory
                ? "No creators found in this category. Try a different filter."
                : "No creators are available right now. Check back soon!"
            }
            action={
              selectedCategory ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <InfiniteScroll
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={creatorsLoading}
            endMessage="You've seen all creators"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </section>
    </div>
  );
}
