"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Building2, Filter, Search, X } from "lucide-react";

import HostelCard from "@/components/hostel/HostelCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { hostelApi } from "@/services/api";
import type { Hostel } from "@/types";

const AMENITIES = [
  "Wi-Fi",
  "AC",
  "Laundry",
  "Gym",
  "Cafeteria",
  "Study Room",
  "Parking",
  "Security",
];

/**
 * Hostel search.
 *
 * Filters live in a persistent left rail on desktop (where they can stay open
 * while results update) and collapse behind a Filters button on mobile, with a
 * count so a hidden filter can't silently narrow the results.
 */
export default function HostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("recommended");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true);

      let sort: string | undefined;
      if (sortBy === "price-low") sort = "price_asc";
      else if (sortBy === "price-high") sort = "price_desc";
      else if (sortBy === "rating") sort = "rating";

      const response = await hostelApi.getAll({
        city: searchCity || undefined,
        page: currentPage,
        limit: 9,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities.join(",") : undefined,
        sort,
      });
      setHostels(response.data);
      setTotalPages(response.pagination.pages);
      setError(null);
    } catch (err) {
      console.error("Error fetching hostels:", err);
      setError("Couldn't load hostels. Check your connection and try again.");
      setHostels([]);
    } finally {
      setLoading(false);
    }
  }, [searchCity, currentPage, sortBy, minPrice, maxPrice, selectedAmenities]);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    setSortBy("recommended");
    setSearchCity("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    selectedAmenities.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Find a hostel</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Browse student accommodation and book a room online.
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by city — Pune, Bengaluru, Indore…"
            aria-label="Search by city"
            className="h-10 pl-8"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="md:hidden"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <Filter className="size-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-sm bg-primary px-1 text-2xs font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </form>

      <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
        {/* ---------- Filters ---------- */}
        <aside className={showFilters ? "block" : "hidden md:block"}>
          <div className="sticky top-20 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </div>

            <div>
              <h3 className="label-annotation mb-2">Monthly rent</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="min-price" className="text-xs text-muted-foreground">
                    Min
                  </label>
                  <Input
                    id="min-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    className="font-mono"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="max-price" className="text-xs text-muted-foreground">
                    Max
                  </label>
                  <Input
                    id="max-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="20000"
                    className="font-mono"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="label-annotation mb-2">Amenities</h3>
              <div className="space-y-1.5">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    htmlFor={`amenity-${amenity}`}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      id={`amenity-${amenity}`}
                      className="size-4 rounded-[3px] border-input accent-[hsl(var(--primary))]"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Results ---------- */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Searching…"
                : `${hostels.length} hostel${hostels.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-sm text-muted-foreground sm:block">
                Sort by
              </label>
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger id="sort" className="h-8 w-[10.5rem]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: low to high</SelectItem>
                  <SelectItem value="price-high">Price: high to low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="overflow-hidden rounded-md border border-border">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : hostels.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={
                hasActiveFilters || searchCity
                  ? "No hostels match your search"
                  : "No hostels listed yet"
              }
              description={
                hasActiveFilters || searchCity
                  ? "Try widening your price range, removing an amenity, or searching a different city."
                  : "Hostels will appear here as they join the platform."
              }
            >
              {(hasActiveFilters || searchCity) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear search and filters
                </Button>
              )}
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hostels.map((hostel) => (
                  <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-1.5"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon-sm"
                      aria-current={currentPage === page ? "page" : undefined}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
