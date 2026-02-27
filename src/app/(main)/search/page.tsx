// ============================================================================
// Search Results Page
// ============================================================================

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Users, FileText, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

// ---------------------------------------------------------------------------
// SearchPage
// ---------------------------------------------------------------------------

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = React.useState(query);
  const [activeTab, setActiveTab] = React.useState("creators");

  // Creator results
  const [creators, setCreators] = React.useState<CreatorCardData[]>([]);
  const [creatorsLoading, setCreatorsLoading] = React.useState(false);
  const [creatorsHasMore, setCreatorsHasMore] = React.useState(true);
  const [creatorsPage, setCreatorsPage] = React.useState(1);

  // Search creators
  const searchCreators = React.useCallback(
    async (q: string, pageNum: number, reset = false) => {
      if (!q.trim()) return;

      try {
        setCreatorsLoading(true);
        const params = new URLSearchParams({
          q: q.trim(),
          page: pageNum.toString(),
          limit: "12",
        });

        const res = await fetch(`/api/creators?${params}`);
        const data = await res.json();
        const newCreators = data.creators ?? [];

        setCreators((prev) =>
          reset ? newCreators : [...prev, ...newCreators],
        );
        setCreatorsHasMore(newCreators.length === 12);
      } catch (error) {
        console.error("[SearchPage] Error:", error);
      } finally {
        setCreatorsLoading(false);
      }
    },
    [],
  );

  // Search on mount and query change
  React.useEffect(() => {
    if (query) {
      setCreatorsPage(1);
      setCreators([]);
      setCreatorsHasMore(true);
      searchCreators(query, 1, true);
    }
  }, [query, searchCreators]);

  const loadMoreCreators = React.useCallback(() => {
    if (creatorsLoading || !query) return;
    const nextPage = creatorsPage + 1;
    setCreatorsPage(nextPage);
    searchCreators(query, nextPage);
  }, [creatorsLoading, creatorsPage, query, searchCreators]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/explore")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Search</h1>
            {query && (
              <p className="text-sm text-muted-foreground">
                Results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search creators..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" variant="default">
            Search
          </Button>
        </form>
      </div>

      {/* No query state */}
      {!query && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Search OnlyHalos"
          description="Find your favorite creators by name or username."
        />
      )}

      {/* Results */}
      {query && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="underline" className="w-full max-w-xs">
            <TabsTrigger variant="underline" value="creators">
              <Users className="mr-1.5 h-4 w-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger variant="underline" value="posts">
              <FileText className="mr-1.5 h-4 w-4" />
              Posts
            </TabsTrigger>
          </TabsList>

          {/* Creators tab */}
          <TabsContent value="creators">
            {creatorsLoading && creators.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" label="Searching creators" />
              </div>
            ) : creators.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No creators found"
                description={`No creators match "${query}". Try a different search term.`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/explore")}
                  >
                    Browse Explore
                  </Button>
                }
              />
            ) : (
              <InfiniteScroll
                onLoadMore={loadMoreCreators}
                hasMore={creatorsHasMore}
                loading={creatorsLoading}
                endMessage="No more results"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </div>
              </InfiniteScroll>
            )}
          </TabsContent>

          {/* Posts tab — placeholder for future implementation */}
          <TabsContent value="posts">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Post search coming soon"
              description="Search through posts from your subscribed creators. This feature is under development."
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
